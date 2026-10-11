import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { openExercise } from "@/lib/exercise-token";
import { gradeReview } from "@/lib/review-engine";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Review grading is temporarily unavailable." }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseToken, userReview } = await req.json();
  if (typeof exerciseToken !== "string" || typeof userReview !== "string" || !userReview.trim()) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  const exercise = openExercise(exerciseToken, user.id);
  if (!exercise) return NextResponse.json({ error: "Exercise is invalid or expired. Generate a new one." }, { status: 400 });

  const { code, bugs, role, language, seniority } = exercise;
  let grading: Awaited<ReturnType<typeof gradeReview>>;
  try {
    grading = await gradeReview(new OpenAI({ apiKey }), code, bugs, userReview);
  } catch (error) {
    console.error("Review grading failed:", error);
    return NextResponse.json({ error: "The review could not be graded reliably. Please try again." }, { status: 502 });
  }

  const { data: completed, error: completionError } = await supabase.rpc("complete_review", {
    p_role: role,
    p_language: language,
    p_seniority: seniority,
    p_exercise_description: exercise.description ?? null,
    p_code: code,
    p_bugs: bugs,
    p_user_review: userReview,
    p_score: grading.score,
    p_caught: grading.caught,
    p_missed: grading.missed,
    p_feedback: grading.feedback,
  });
  if (completionError) {
    console.error("Could not save completed review", completionError.message);
    return NextResponse.json({ error: "Your review was graded but could not be saved. No credit was used." }, { status: 500 });
  }
  if (!completed) return NextResponse.json({ error: "No credits remaining. Upgrade to ReviewIQ Pro to continue." }, { status: 402 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  const { count: reviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  return NextResponse.json({ ...grading, creditsRemaining: profile?.credits ?? null, reviewNumber: reviewCount ?? null });
}
