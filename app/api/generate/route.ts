import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
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
        content: `You are an expert software engineer creating code review interview exercises.
Generate a realistic PR-style code snippet in the requested language.
Plant exactly 3 bugs — subtle but catchable by a senior engineer.
Bugs should be logical errors, not syntax errors.

Respond in this exact JSON format:
{
  "code": "the full code snippet as a string",
  "bugs": [
    {"id": 1, "line": "approximate line or description", "description": "what the bug is and why it matters"},
    {"id": 2, "line": "...", "description": "..."},
    {"id": 3, "line": "...", "description": "..."}
  ]
}

Return only raw JSON. No markdown. No backticks. No explanation.`,
      },
      {
        role: "user",
        content: `Role: ${role}\nLanguage: ${language}\nSeniority: ${seniority}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return NextResponse.json(data);
}
