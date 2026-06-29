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
        content: `You are a senior engineering interviewer grading a code review submission.
You have the code and the exact list of planted bugs.
The candidate submitted a free-text review.

Your job:
1. Determine which bugs the candidate caught (even if worded loosely)
2. List what they missed
3. Give a score out of 10
4. Write 2-3 lines on how a stronger reviewer would have approached it

Respond in this exact JSON format:
{
  "score": 7,
  "caught": [1, 3],
  "missed": [2],
  "feedback": "..."
}

Return only raw JSON. No markdown. No backticks. No explanation.`,
      },
      {
        role: "user",
        content: `CODE:\n${code}\n\nPLANTED BUGS:\n${bugsStr}\n\nCANDIDATE REVIEW:\n${userReview}`,
      },
    ],
    temperature: 0.2,
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
