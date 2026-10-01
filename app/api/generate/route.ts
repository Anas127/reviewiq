import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { sealExercise } from "@/lib/exercise-token";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Exercise generation is temporarily unavailable." }, { status: 503 });
  }
  const client = new OpenAI({ apiKey });
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check credits
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
- Security issues (SQL injection, command injection, unsafe deserialization, etc.)
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

  const data = JSON.parse(response.choices[0].message.content!);
  const exerciseToken = sealExercise({
    userId: user.id,
    code: data.code,
    bugs: data.bugs,
    role,
    language,
    seniority,
  });

  return NextResponse.json({ code: data.code, exerciseToken });
}
