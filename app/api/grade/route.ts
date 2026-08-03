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

<<<<<<< HEAD
  const { exerciseId, userReview } = await req.json();

  if (!exerciseId || !userReview?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  const { data: exercise, error: exerciseError } = await supabase
    .from("review_exercises")
    .select("id, role, language, seniority, code, bugs, graded_at")
    .eq("id", exerciseId)
    .eq("user_id", user.id)
    .single();

  if (exerciseError || !exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  if (exercise.graded_at) {
    return NextResponse.json(
      { error: "Exercise already graded" },
      { status: 409 },
    );
  }

  const bugs = exercise.bugs as { id: number; description: string }[];
=======
  const { code, bugs, userReview, role, language, seniority } =
    await req.json();
>>>>>>> origin/main

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
<<<<<<< HEAD
        content: `CODE:\n${exercise.code}\n\nPLANTED BUGS:\n${bugsStr}\n\nCANDIDATE REVIEW:\n${userReview}`,
=======
        content: `CODE:\n${code}\n\nPLANTED BUGS:\n${bugsStr}\n\nCANDIDATE REVIEW:\n${userReview}`,
>>>>>>> origin/main
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(response.choices[0].message.content!);

<<<<<<< HEAD
  const { error: decrementError } = await supabase.rpc("decrement_credits");
  if (decrementError) {
    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 },
    );
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    user_id: user.id,
    role: exercise.role ?? "",
    language: exercise.language ?? "",
    seniority: exercise.seniority ?? "",
    code: exercise.code,
=======
  await supabase.rpc("decrement_credits");

  await supabase.from("reviews").insert({
    user_id: user.id,
    role: role ?? "",
    language: language ?? "",
    seniority: seniority ?? "",
    code,
>>>>>>> origin/main
    bugs,
    user_review: userReview,
    score: data.score,
    caught: data.caught,
    missed: data.missed,
    feedback: data.feedback,
  });

<<<<<<< HEAD
  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 },
    );
  }

  await supabase
    .from("review_exercises")
    .update({ graded_at: new Date().toISOString() })
    .eq("id", exercise.id);

  return NextResponse.json({ ...data, bugs });
=======
  return NextResponse.json(data);
>>>>>>> origin/main
}
