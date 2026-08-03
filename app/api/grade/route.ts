import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, bugs, userReview, role, language, seniority } =
    await req.json();

  const bugsStr = bugs
    .map(
      (b: { id: number; description: string }) =>
        `Bug ${b.id}: ${b.description}`,
    )
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a senior software engineering interviewer evaluating a candidate's code review.

You are given:
1. The source code.
2. The intentionally planted bugs.
3. The candidate's written review.

Your job is to fairly evaluate the review.

Important grading rules:
- Do NOT require the candidate to use the exact wording of the planted bugs.
- Give credit whenever the candidate identifies the same underlying issue, even if phrased differently.
- Also give credit for any additional legitimate bug, correctness issue, logic flaw, edge case, validation issue, security issue, mutability issue, API design issue, or runtime issue that genuinely exists in the code, even if it was not one of the planted bugs.
- Do NOT invent bugs that are not present.
- Do NOT reward style preferences, refactoring suggestions, or subjective opinions unless they describe an actual defect or correctness issue.
- If a candidate finds an additional valid bug that wasn't planted, mention it positively but do not count it as a missed planted bug.

Scoring:
- 10/10 = Candidate found every planted bug or an equivalent issue covering the same underlying problem.
- Give partial credit where appropriate.
- Do not penalize candidates for mentioning extra valid issues.
- A review can score highly even if it doesn't use the same terminology as the planted bug list.

Respond ONLY with valid JSON in this exact format:

{
  "score": 8,
  "caught": [
    {
      "bug": 1,
      "reason": "Why this planted bug was considered caught."
    }
  ],
  "missed": [
    {
      "bug": 2,
      "description": "Short description of the planted bug.",
      "reason": "Why the candidate missed it."
    }
  ],
  "extraFindings": [
    "Any additional valid bug the candidate found that wasn't part of the planted bug list."
  ],
  "feedback": "Write 2-3 sentences explaining how a stronger reviewer would have approached the review."
}

Return ONLY raw JSON.
No markdown.
No code fences.
No explanations.`,
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
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(response.choices[0].message.content!);

  await supabase.rpc("decrement_credits");

  await supabase.from("reviews").insert({
    user_id: user.id,
    role: role ?? "",
    language: language ?? "",
    seniority: seniority ?? "",
    code,
    bugs,
    user_review: userReview,
    score: data.score,
    caught: data.caught,
    missed: data.missed,
    feedback: data.feedback,
  });

  return NextResponse.json(data);
}
