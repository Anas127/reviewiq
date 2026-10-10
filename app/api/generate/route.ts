import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { sealExercise } from "@/lib/exercise-token";
import { generateExercise } from "@/lib/review-engine";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Exercise generation is temporarily unavailable." }, { status: 503 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("credits").eq("id", user.id).single();
    if (profileError) {
      console.error("Could not load profile:", profileError.message);
      return NextResponse.json({ error: "Exercise generation is temporarily unavailable." }, { status: 500 });
    }
    if (!profile || profile.credits < 1) return NextResponse.json({ error: "No credits remaining" }, { status: 402 });

    const { role, language, seniority } = await req.json();
    if (typeof role !== "string" || typeof language !== "string" || typeof seniority !== "string") {
      return NextResponse.json({ error: "Invalid exercise configuration" }, { status: 400 });
    }

    const { code, bugs } = await generateExercise(new OpenAI({ apiKey }), { role, language, seniority });
    const exerciseToken = sealExercise({ userId: user.id, code, bugs, role, language, seniority });
    return NextResponse.json({ code, exerciseToken });
  } catch (error) {
    console.error("Exercise generation failed:", error);
    return NextResponse.json({ error: "Exercise generation is temporarily unavailable." }, { status: 500 });
  }
}
