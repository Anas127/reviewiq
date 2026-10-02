import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { sealExercise } from "@/lib/exercise-token";

const MAX_GENERATION_ATTEMPTS = 3;

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

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior software engineer creating realistic code review interview exercises.

Generate a pull request containing exactly 3 intentional bugs.

Rules:
- The bugs MUST be objectively verifiable from the code alone.
- A reviewer should never need hidden business requirements to identify them.
- The code should look realistic and production-like.
- The bugs should require careful review, but should not be impossible to find.

Allowed bug categories:
- Input validation
- Missing null/None checks
- Boundary conditions
- Off-by-one errors
- Incorrect comparison operators
- Division by zero
- Incorrect loop logic
- Removing items while iterating
- Mutable shared state
- Shallow vs deep copy
- Resource leaks
- Missing error handling
- Incorrect return values
- Duplicate handling
- Incorrect condition ordering
- Race conditions
- Security issues such as SQL injection, command injection, or unsafe deserialization
- Authentication or authorization mistakes

Do NOT generate:
- Syntax errors
- Formatting/style issues
- Performance optimizations
- Missing comments
- Naming issues
- Subjective code quality issues
- Hidden business rules
- Bugs that require guessing the intended behavior
- Bugs that depend on undocumented requirements

Each planted bug must have a single objectively correct explanation.

Before returning the exercise, internally verify every planted bug against the final code.

For each bug, confirm:
- The claimed defect actually exists in the final code.
- The code does not already handle or prevent the claimed defect.
- The defect causes a concrete correctness, security, reliability, or resource-management problem.
- The defect can be demonstrated without assuming undocumented requirements or deployment conditions.
- A reasonable reviewer could identify it directly from the provided code.

Reject and replace any proposed bug that fails any of these checks.

Important:
- Do not claim missing input validation when the relevant input is already validated.
- Do not treat normal framework or deployment configuration as a security vulnerability without a concrete exploitable defect.
- Do not use debatable best practices as planted bugs.
- The 3 planted bugs must be distinct underlying defects.

Respond ONLY as JSON:

{
  "code": "...",
  "bugs": [
    {
      "id": 1,
      "line": "...",
      "description": "Clear explanation of the bug and why it is incorrect."
    },
    {
      "id": 2,
      "line": "...",
      "description": "..."
    },
    {
      "id": 3,
      "line": "...",
      "description": "..."
    }
  ]
}

Return only raw JSON. No markdown.`,
          },
          {
            role: "user",
            content: `Role: ${role}\nLanguage: ${language}\nSeniority: ${seniority}`,
          },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        console.error(`Generation attempt ${attempt}: empty response`);
        continue;
      }

      let data;

      try {
        data = JSON.parse(content);
      } catch {
        console.error(`Generation attempt ${attempt}: invalid JSON`);
        continue;
      }

      if (
        typeof data.code !== "string" ||
        !Array.isArray(data.bugs) ||
        data.bugs.length !== 3
      ) {
        console.error(`Generation attempt ${attempt}: invalid structure`);
        continue;
      }

      const validationResponse = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an independent validator for a code review interview exercise.

Check whether EACH claimed bug genuinely exists in the provided code.

A valid planted bug must:
- Be objectively demonstrable from the code.
- Cause a concrete correctness, security, reliability, or resource-management problem.
- Not depend on undocumented requirements or assumptions.
- Not merely be a best practice or stylistic preference.
- Not claim missing validation when the code already handles the case.
- Be distinct from the other planted bugs.

Be strict.

Examples of reasons to reject:
- The claimed failure cannot actually occur.
- The code already prevents the claimed bug.
- The claim depends on unspecified application requirements.
- The issue is merely defensive programming or a best practice.
- A configuration choice is labeled a vulnerability without a concrete security defect.
- Two bugs are merely different consequences of the same underlying defect.

If even one bug fails these requirements, reject the entire exercise.

Return ONLY JSON:

{
  "valid": true,
  "reason": ""
}

or:

{
  "valid": false,
  "reason": "Short explanation of what is invalid."
}`,
          },
          {
            role: "user",
            content: `CODE:
${data.code}

CLAIMED BUGS:
${JSON.stringify(data.bugs)}`,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const validationContent = validationResponse.choices[0]?.message?.content;

      if (!validationContent) {
        console.error(`Validation attempt ${attempt}: empty response`);
        continue;
      }

      let validation;

      try {
        validation = JSON.parse(validationContent);
      } catch {
        console.error(`Validation attempt ${attempt}: invalid JSON`);
        continue;
      }

      if (validation.valid !== true) {
        console.warn(
          `Exercise rejected on attempt ${attempt}:`,
          validation.reason,
        );
        continue;
      }

      // Only a validated exercise ever reaches the user.
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
    }

    // All internal attempts failed. Don't expose validation details to customers.
    console.error("Could not produce a valid exercise after all attempts");

    return NextResponse.json(
      {
        error:
          "We couldn't generate this exercise right now. Please try again.",
      },
      { status: 503 },
    );
  } catch (error) {
    console.error("Exercise generation failed:", error);

    return NextResponse.json(
      { error: "Exercise generation is temporarily unavailable." },
      { status: 500 },
    );
  }
}
