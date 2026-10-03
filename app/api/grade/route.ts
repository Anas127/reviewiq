import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { openExercise } from "@/lib/exercise-token";

type CaughtIssue = {
  bug: number;
  reason: string;
};

type MissedIssue = {
  bug: number;
  description: string;
  reason: string;
};

type GradingResult = {
  caught: CaughtIssue[];
  missed: MissedIssue[];
  extraFindings: string[];
  falsePositives: string[];
  reviewQuality: number;
  feedback: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculateScore(
  caughtCount: number,
  totalBugs: number,
  reviewQuality: number,
  falsePositiveCount: number,
) {
  if (totalBugs <= 0) return 0;

  // 80% of the score comes from actually finding the planted issues.
  const detectionScore = (caughtCount / totalBugs) * 8;

  // 20% rewards how clearly and usefully the candidate explained
  // the issues they actually identified.
  const qualityScore = (clamp(reviewQuality, 0, 10) / 10) * 2;

  // Incorrect claims matter in a code review. Each substantive false
  // positive costs half a point.
  const falsePositivePenalty = falsePositiveCount * 0.5;

  const rawScore = detectionScore + qualityScore - falsePositivePenalty;

  // Keep one decimal place.
  return clamp(Math.round(rawScore * 10) / 10, 0, 10);
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Review grading is temporarily unavailable.",
      },
      {
        status: 503,
      },
    );
  }

  const client = new OpenAI({
    apiKey,
  });

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const { exerciseToken, userReview } = await req.json();

  if (
    typeof exerciseToken !== "string" ||
    typeof userReview !== "string" ||
    !userReview.trim()
  ) {
    return NextResponse.json(
      {
        error: "Invalid submission",
      },
      {
        status: 400,
      },
    );
  }

  const exercise = openExercise(exerciseToken, user.id);

  if (!exercise) {
    return NextResponse.json(
      {
        error: "Exercise is invalid or expired. Generate a new one.",
      },
      {
        status: 400,
      },
    );
  }

  const { code, bugs, role, language, seniority } = exercise;

  const bugsStr = bugs
    .map(
      (bug: { id: number; description: string }) =>
        `Bug ${bug.id}: ${bug.description}`,
    )
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-6-sol",
    reasoning_effort: "none",
    messages: [
      {
        role: "system",
        content: `You are a senior software engineering interviewer evaluating a candidate's code review.

You are given:
1. Source code.
2. The intentionally planted bugs.
3. The candidate's written review.

Your task is to CLASSIFY the candidate's findings accurately.

Do NOT calculate the final numeric score. The server calculates it deterministically.

PLANTED BUG CLASSIFICATION

For every planted bug, decide whether the candidate caught the underlying defect.

A planted bug is caught when:
- The candidate identifies the same underlying technical problem.
- Exact terminology is NOT required.
- Exact line numbers are NOT required.
- The candidate must demonstrate that they noticed the actual defect.
- A vague statement such as "this could be improved" is not enough.

A planted bug is missed when:
- The candidate never identifies the underlying problem.
- The candidate discusses a different issue.
- The candidate makes only a vague or stylistic observation.

EXTRA FINDINGS

A candidate may identify a genuine defect that was not intentionally planted.

Count it as an extra finding only when:
- It genuinely exists in the provided code.
- It represents a correctness, runtime, security, validation, state, concurrency, data integrity, API contract, or meaningful edge-case problem.

Do NOT count:
- Style preferences.
- Naming preferences.
- Generic refactoring suggestions.
- Speculative problems unsupported by the code.

FALSE POSITIVES

A false positive is a candidate claim that:
- Describes a bug that does not actually exist in the provided code, or
- Makes a materially incorrect technical claim.

Do NOT treat subjective style suggestions as false positives. Simply ignore them.

REVIEW QUALITY

Give reviewQuality from 0 to 10.

This measures ONLY the quality of the candidate's explanation of findings they actually made.

Consider:
- Specificity.
- Correct explanation of impact.
- Actionability.
- Quality of proposed fixes.
- Technical clarity.

Do NOT increase reviewQuality because the candidate found more bugs.
Do NOT decrease reviewQuality merely because planted bugs were missed.

Examples:
- "This is broken" with no explanation: low quality.
- Correct issue + clear impact: good quality.
- Correct issue + clear impact + practical fix: high quality.

Return ONLY valid JSON in this exact structure:

{
  "caught": [
    {
      "bug": 1,
      "reason": "Why the candidate's review demonstrates that they caught this issue."
    }
  ],
  "missed": [
    {
      "bug": 2,
      "description": "Short description of the planted bug.",
      "reason": "Why this issue was not identified."
    }
  ],
  "extraFindings": [],
  "falsePositives": [],
  "reviewQuality": 8,
  "feedback": "2-3 concise sentences explaining what the reviewer did well and what would most improve the next review."
}

Every planted bug MUST appear exactly once in either caught or missed.

Return raw JSON only.
No markdown.
No code fences.`,
      },
      {
        role: "user",
        content: `CODE:
${code}

PLANTED BUGS:
${bugsStr}

CANDIDATE REVIEW:
${userReview}`,
      },
    ],
    response_format: {
      type: "json_object",
    },
  });

  let data: GradingResult;

  try {
    data = JSON.parse(response.choices[0].message.content ?? "");
  } catch {
    return NextResponse.json(
      {
        error: "The review could not be graded reliably. Please try again.",
      },
      {
        status: 502,
      },
    );
  }

  const validBugIds = new Set(bugs.map((bug: { id: number }) => bug.id));

  const caught = Array.isArray(data.caught)
    ? data.caught.filter((item) => item && validBugIds.has(item.bug))
    : [];

  const caughtIds = new Set(caught.map((item) => item.bug));

  // Server derives missed bugs from the canonical planted-bug list.
  // We do not trust the model to determine how many bugs exist.
  const missed = bugs
    .filter((bug: { id: number }) => !caughtIds.has(bug.id))
    .map((bug: { id: number; description: string }) => {
      const modelMissed = Array.isArray(data.missed)
        ? data.missed.find((item) => item.bug === bug.id)
        : undefined;

      return {
        bug: bug.id,
        description: bug.description,
        reason:
          modelMissed?.reason ??
          "This planted issue was not identified in the review.",
      };
    });

  const extraFindings = Array.isArray(data.extraFindings)
    ? data.extraFindings.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const falsePositives = Array.isArray(data.falsePositives)
    ? data.falsePositives.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const reviewQuality =
    typeof data.reviewQuality === "number"
      ? clamp(data.reviewQuality, 0, 10)
      : 0;

  const score = calculateScore(
    caught.length,
    bugs.length,
    reviewQuality,
    falsePositives.length,
  );

  const feedback =
    typeof data.feedback === "string"
      ? data.feedback
      : "Focus on systematically checking correctness, edge cases, state changes, and security risks.";

  const { data: completed, error: completionError } = await supabase.rpc(
    "complete_review",
    {
      p_role: role,
      p_language: language,
      p_seniority: seniority,
      p_code: code,
      p_bugs: bugs,
      p_user_review: userReview,
      p_score: score,
      p_caught: caught,
      p_missed: missed,
      p_feedback: feedback,
    },
  );

  if (completionError) {
    console.error("Could not save completed review", completionError.message);

    return NextResponse.json(
      {
        error:
          "Your review was graded but could not be saved. No credit was used.",
      },
      {
        status: 500,
      },
    );
  }

  if (!completed) {
    return NextResponse.json(
      {
        error: "No credits remaining. Upgrade to ReviewIQ Pro to continue.",
      },
      {
        status: 402,
      },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    score,
    caught,
    missed,
    extraFindings,
    falsePositives,
    reviewQuality,
    feedback,
    bugs,
    creditsRemaining: profile?.credits ?? null,
    reviewNumber: reviewCount ?? null,
  });
}
