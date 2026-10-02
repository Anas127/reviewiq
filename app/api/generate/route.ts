import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { sealExercise } from "@/lib/exercise-token";

type BugPattern = {
  key: string;
  instruction: string;
  groundTruth: string;
};

const BUG_PATTERNS: BugPattern[] = [
  {
    key: "division-by-zero",
    instruction:
      "Create a calculation where a denominator can demonstrably become zero, then divide by it without checking for zero.",
    groundTruth:
      "A denominator can be zero and is used in division without a zero check, causing a division-by-zero failure.",
  },
  {
    key: "mutate-during-iteration",
    instruction:
      "Iterate over a collection while removing elements from that same collection, causing elements to be skipped or iteration to behave incorrectly.",
    groundTruth:
      "The code modifies a collection while iterating over it, which can skip elements or produce incorrect iteration behavior.",
  },
  {
    key: "resource-leak",
    instruction:
      "Open a file, database connection, cursor, or similar resource and create a reachable path where the function returns or throws without closing it.",
    groundTruth:
      "A resource is left open on a reachable execution path, causing a resource leak.",
  },
  {
    key: "missing-commit",
    instruction:
      "Perform a database INSERT, UPDATE, or DELETE requiring an explicit commit, but return success without committing.",
    groundTruth:
      "A database write is performed without committing the transaction, so the operation may not persist despite reporting success.",
  },
  {
    key: "off-by-one",
    instruction:
      "Create a loop or index boundary where the intended range is explicit from the surrounding code, but the implementation processes one too many or one too few elements.",
    groundTruth:
      "A loop or index boundary is off by one, causing an element to be skipped or an invalid element to be accessed.",
  },
  {
    key: "null-dereference",
    instruction:
      "Use a function or lookup that visibly can return null/None, then dereference the result or call a method on it without checking first.",
    groundTruth:
      "A value that can explicitly be null/None is dereferenced without a check, causing a runtime failure.",
  },
  {
    key: "incorrect-return-type",
    instruction:
      "Create a function whose normal path returns one type but whose error path returns an incompatible type, then have callers use the result as the normal type.",
    groundTruth:
      "The function returns an incompatible type on a reachable path, which can break callers expecting the normal return type.",
  },
  {
    key: "sql-injection",
    instruction:
      "Construct a SQL query by directly concatenating or interpolating user-controlled input instead of using parameterized SQL.",
    groundTruth:
      "User-controlled input is directly incorporated into a SQL query, allowing SQL injection.",
  },
  {
    key: "missing-authorization",
    instruction:
      "Create an authenticated operation on a user-owned resource that loads or modifies the resource by ID but never verifies that the resource belongs to the authenticated user.",
    groundTruth:
      "The operation does not verify resource ownership, allowing an authenticated user to access or modify another user's resource.",
  },
  {
    key: "duplicate-handling",
    instruction:
      "Create code explicitly intended to maintain unique values, but implement the duplicate check incorrectly so duplicates can still be added.",
    groundTruth:
      "The duplicate check is incorrect, allowing duplicate values despite the explicit uniqueness requirement.",
  },
  {
    key: "wrong-boundary",
    instruction:
      "Make an intended inclusive or exclusive boundary explicit using a named constant or surrounding code, then use the wrong comparison operator at that boundary.",
    groundTruth:
      "The wrong comparison operator is used at an explicit boundary, incorrectly accepting or rejecting the boundary value.",
  },
  {
    key: "shallow-copy",
    instruction:
      "Create a nested mutable structure, make a shallow copy of it, then mutate nested data in the copy where the surrounding code clearly expects the original to remain unchanged.",
    groundTruth:
      "A shallow copy shares nested mutable objects with the original, so modifying the copy unexpectedly modifies the original data.",
  },
  {
    key: "incorrect-condition-order",
    instruction:
      "Create a compound condition where a value is dereferenced or indexed before the condition checks whether that operation is safe.",
    groundTruth:
      "The conditions are evaluated in the wrong order, so an unsafe operation can occur before the guard that was supposed to prevent it.",
  },
  {
    key: "command-injection",
    instruction:
      "Pass user-controlled input into a shell command through string construction with shell execution enabled.",
    groundTruth:
      "User-controlled input is incorporated into a shell command, allowing command injection.",
  },
  {
    key: "unsafe-deserialization",
    instruction:
      "Deserialize untrusted input using a mechanism that can execute or instantiate unsafe objects.",
    groundTruth:
      "Untrusted input is deserialized using an unsafe mechanism, which can allow arbitrary code execution or unsafe object construction.",
  },
];

function pickRandomBugs(count: number): BugPattern[] {
  const shuffled = [...BUG_PATTERNS];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Exercise generation is temporarily unavailable." },
        { status: 503 },
      );
    }

    const client = new OpenAI({ apiKey });
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Could not load profile:", profileError.message);

      return NextResponse.json(
        { error: "Exercise generation is temporarily unavailable." },
        { status: 500 },
      );
    }

    if (!profile || profile.credits < 1) {
      return NextResponse.json(
        { error: "No credits remaining" },
        { status: 402 },
      );
    }

    const body = await req.json();
    const { role, language, seniority } = body;

    if (
      typeof role !== "string" ||
      typeof language !== "string" ||
      typeof seniority !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid exercise configuration" },
        { status: 400 },
      );
    }

    const selectedBugs = pickRandomBugs(3);

    const requiredBugs = selectedBugs
      .map(
        (bug, index) =>
          `BUG ${index + 1} — ${bug.key}
${bug.instruction}`,
      )
      .join("\n\n");

    const response = await client.chat.completions.create({
      model: "gpt-6-sol",
      messages: [
        {
          role: "system",
          content: `You are creating a realistic code review interview exercise.

The application has already selected exactly 3 defects.

YOUR JOB IS NOT TO INVENT BUGS.

Your job is to write realistic code that contains EXACTLY the three required defects below.

The candidate must be able to identify each defect directly from the code.

REQUIRED DEFECTS:

${requiredBugs}

STRICT RULES:

- Implement all 3 required defects.
- Each defect must be clearly and objectively present in the final code.
- Do not fix or neutralize any required defect elsewhere in the code.
- Do not introduce additional intentional defects.
- Do not introduce syntax errors.
- Do not introduce fake bugs or ambiguous behavior.
- Do not rely on undocumented business requirements.
- Do not turn style preferences into defects.
- Do not add comments revealing where the bugs are.
- Do not write comments saying that something is intentionally broken.
- The code must look like plausible production code.
- Adapt the scenario and APIs to the requested role, language, and seniority.
- Keep the exercise reasonably short enough for an interview code review.

Before responding, silently inspect the final code and ensure that all three required defects are actually implemented.

Respond ONLY with valid JSON:

{
  "code": "the complete exercise code",
  "evidence": [
    {
      "bug": 1,
      "line": "exact relevant line from the generated code"
    },
    {
      "bug": 2,
      "line": "exact relevant line from the generated code"
    },
    {
      "bug": 3,
      "line": "exact relevant line from the generated code"
    }
  ]
}

Return raw JSON only.
No markdown.
No code fences.`,
        },
        {
          role: "user",
          content: `Create the exercise for:

Role: ${role}
Language: ${language}
Seniority: ${seniority}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty exercise content");
    }

    const generated = JSON.parse(content);

    if (
      typeof generated.code !== "string" ||
      generated.code.trim().length === 0 ||
      !Array.isArray(generated.evidence) ||
      generated.evidence.length !== 3
    ) {
      throw new Error("Generated exercise has invalid structure");
    }

    for (let i = 0; i < generated.evidence.length; i++) {
      const evidence = generated.evidence[i];

      if (
        evidence?.bug !== i + 1 ||
        typeof evidence?.line !== "string" ||
        evidence.line.trim().length === 0
      ) {
        throw new Error("Generated exercise has invalid evidence");
      }

      if (!generated.code.includes(evidence.line)) {
        throw new Error(
          `Generated evidence for bug ${i + 1} does not exist in code`,
        );
      }
    }

    /*
     * IMPORTANT:
     *
     * GPT does NOT decide what the correct answers are.
     *
     * The selected bug patterns are our canonical answer key.
     * GPT only tells us where it implemented each selected defect.
     */
    const bugs = selectedBugs.map((pattern, index) => ({
      id: index + 1,
      line: generated.evidence[index].line,
      description: pattern.groundTruth,
    }));

    const exerciseToken = sealExercise({
      userId: user.id,
      code: generated.code,
      bugs,
      role,
      language,
      seniority,
    });

    return NextResponse.json({
      code: generated.code,
      exerciseToken,
    });
  } catch (error) {
    console.error("Exercise generation failed:", error);

    return NextResponse.json(
      { error: "Exercise generation is temporarily unavailable." },
      { status: 500 },
    );
  }
}
