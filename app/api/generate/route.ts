import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { sealExercise } from "@/lib/exercise-token";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return NextResponse.json(
        { error: "No credits remaining" },
        { status: 402 },
      );
    }

    const { role, language, seniority } = await req.json();

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

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior software engineer creating a realistic code review interview exercise.

Generate ONE realistic code change containing exactly 3 intentional bugs.

The candidate will review the code without seeing the answer key. Your 3 bugs will become the fixed answer key used later to grade the candidate.

QUALITY IS CRITICAL.

Every planted bug MUST:
- Actually exist in the final code you return.
- Be objectively verifiable from the code alone.
- Cause a concrete correctness, security, reliability, or resource-management problem.
- Be identifiable without assuming undocumented business requirements.
- Be distinct from the other two bugs.
- Have one clearly correct explanation.
- Be something a competent engineer could reasonably identify during code review.

Good bug categories include:
- Missing null/None handling where null can concretely occur
- Boundary and off-by-one errors
- Incorrect comparison operators
- Division by zero
- Incorrect loop logic
- Removing items while iterating
- Mutable shared state
- Shallow versus deep copy errors
- Resource leaks
- Missing transaction commits
- Incorrect return values
- Duplicate handling errors
- Incorrect condition ordering
- Race conditions
- SQL injection
- Command injection
- Unsafe deserialization
- Concrete authentication or authorization flaws

DO NOT use:
- Syntax errors
- Formatting or style issues
- Naming issues
- Missing comments
- Mere performance optimizations
- Subjective code-quality opinions
- Generic "more validation would be better" claims
- Hypothetical edge cases that the code already handles
- Deployment configuration presented as a vulnerability without a concrete exploit
- Hidden business requirements
- Bugs whose validity depends on guessing intended behavior
- Multiple bugs that are merely consequences of the same underlying defect

CRITICAL SELF-CHECK:

Before producing your final JSON, inspect the FINAL CODE against each of your three proposed bugs individually.

For Bug 1, Bug 2 and Bug 3 ask:
1. Can the claimed failure actually happen in this exact code?
2. Does the code already prevent or handle it?
3. Can I explain the concrete failure without inventing requirements?
4. Is this genuinely different from the other two bugs?

If ANY answer makes the bug questionable, replace that bug and re-check the final code before responding.

The final code and answer key must agree exactly.

Respond ONLY with valid JSON:

{
  "code": "...",
  "bugs": [
    {
      "id": 1,
      "line": "...",
      "description": "Concrete explanation of the bug and its effect."
    },
    {
      "id": 2,
      "line": "...",
      "description": "Concrete explanation of the bug and its effect."
    },
    {
      "id": 3,
      "line": "...",
      "description": "Concrete explanation of the bug and its effect."
    }
  ]
}

Return raw JSON only.
No markdown.
No code fences.`,
        },
        {
          role: "user",
          content: `Create an exercise for:
Role: ${role}
Language: ${language}
Seniority: ${seniority}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty exercise content");
    }

    const data = JSON.parse(content);

    if (
      typeof data.code !== "string" ||
      !Array.isArray(data.bugs) ||
      data.bugs.length !== 3
    ) {
      throw new Error("Generated exercise has invalid structure");
    }

    for (let i = 0; i < data.bugs.length; i++) {
      const bug = data.bugs[i];

      if (
        bug?.id !== i + 1 ||
        typeof bug?.line !== "string" ||
        typeof bug?.description !== "string"
      ) {
        throw new Error("Generated exercise has invalid bug structure");
      }
    }

    const exerciseToken = sealExercise({
      userId: user.id,
      code: data.code,
      bugs: data.bugs,
      role,
      language,
      seniority,
    });

    return NextResponse.json({
      code: data.code,
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
