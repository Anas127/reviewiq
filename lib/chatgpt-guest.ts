import { createHash, randomUUID } from "crypto";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { openExercise, sealExercise } from "@/lib/exercise-token";
import { generateExercise, gradeReview, type ExerciseConfig } from "@/lib/review-engine";

const GUEST_REVIEW_LIMIT = 2;

function services() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const hashSecret = process.env.CHATGPT_GUEST_HASH_SECRET;
  if (!url || !key || !openaiKey || !hashSecret || !process.env.EXERCISE_TOKEN_SECRET) {
    throw new Error("ChatGPT guest reviews are not configured");
  }
  return {
    db: createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }),
    ai: new OpenAI({ apiKey: openaiKey }),
    hashSecret,
  };
}

function subjectHash(subject: unknown, secret: string) {
  if (typeof subject !== "string" || !subject || subject.length > 512) return null;
  return createHash("sha256").update("reviewiq-chatgpt-guest-v1\0").update(secret).update("\0").update(subject).digest("hex");
}

function handoff() {
  return {
    accountConnectionRequired: true,
    message: "Your two guest reviews are complete. Connect your ReviewIQ account to continue practicing here in ChatGPT.",
  };
}

export async function guestStatus(subject: unknown) {
  const { db, hashSecret } = services();
  const hash = subjectHash(subject, hashSecret);
  if (!hash) return { error: "ChatGPT did not provide a user identifier. Guest reviews are unavailable in this client." };
  const { count, error } = await db.from("chatgpt_guest_reviews").select("*", { count: "exact", head: true }).eq("subject_hash", hash).eq("status", "complete");
  if (error) throw error;
  return { completed: count ?? 0, remaining: Math.max(0, GUEST_REVIEW_LIMIT - (count ?? 0)), ...(count && count >= GUEST_REVIEW_LIMIT ? handoff() : {}) };
}

export async function guestStart(subject: unknown, config: ExerciseConfig) {
  const { db, ai, hashSecret } = services();
  const hash = subjectHash(subject, hashSecret);
  if (!hash) return { error: "ChatGPT did not provide a user identifier. Guest reviews are unavailable in this client." };
  const id = randomUUID();
  const rawLimit = Number(process.env.CHATGPT_GUEST_DAILY_LIMIT || 100);
  const dailyLimit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(rawLimit, 10000)) : 100;
  let { data: reservation, error } = await db.rpc("chatgpt_guest_reserve_review", { p_id: id, p_subject_hash: hash, p_daily_limit: dailyLimit });
  if (error) throw error;
  if (reservation === "active_review") {
    const { data: active, error: activeError } = await db.from("chatgpt_guest_reviews").select("id,exercise_token,status,created_at").eq("subject_hash", hash).in("status", ["pending", "grading"]).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (activeError) throw activeError;
    if (active?.exercise_token) {
      const exercise = openExercise(active.exercise_token, hash);
      if (exercise && exercise.guestReviewId === active.id) return { code: exercise.code, instruction: "Continue this guest review. Submit your written findings for official ReviewIQ grading." };
    }
    if (active?.status === "pending" && Date.now() - new Date(active.created_at).getTime() > 5 * 60_000) {
      const { error: deleteError } = await db.from("chatgpt_guest_reviews").delete().eq("id", active.id).eq("subject_hash", hash).eq("status", "pending");
      if (deleteError) throw deleteError;
      ({ data: reservation, error } = await db.rpc("chatgpt_guest_reserve_review", { p_id: id, p_subject_hash: hash, p_daily_limit: dailyLimit }));
      if (error) throw error;
    }
  }
  if (reservation === "complete_limit") return { limitReached: true, ...handoff() };
  if (reservation === "active_review") return { error: "Your previous guest exercise is still being prepared or graded. Please try again shortly." };
  if (reservation === "generation_limit") return { error: "Guest exercise generation is unavailable for this ChatGPT account. Connect a ReviewIQ account to continue.", ...handoff() };
  if (reservation === "daily_limit") return { error: "Guest reviews are at capacity today. Please try again later or connect a ReviewIQ account.", ...handoff() };
  if (reservation !== "reserved") throw new Error("Guest review reservation failed");

  try {
    const { code, bugs } = await generateExercise(ai, config);
    const exerciseToken = sealExercise({ ...config, code, bugs, userId: hash, guestReviewId: id });
    const { data: stored, error: storeError } = await db.from("chatgpt_guest_reviews").update({ exercise_token: exerciseToken }).eq("id", id).eq("subject_hash", hash).eq("status", "pending").select("id").single();
    if (storeError || !stored) throw storeError || new Error("Could not save guest exercise");
    return { code, instruction: "Review this code for correctness, security, and edge cases. Explain the issues you find and their impact. Submit your written review for official ReviewIQ grading." };
  } catch (cause) {
    await db.from("chatgpt_guest_reviews").delete().eq("id", id).eq("subject_hash", hash).eq("status", "pending");
    throw cause;
  }
}

export async function guestSubmit(subject: unknown, userReview: string) {
  const { db, ai, hashSecret } = services();
  const hash = subjectHash(subject, hashSecret);
  if (!hash) return { error: "ChatGPT did not provide a user identifier. Guest reviews are unavailable in this client." };
  const { data: active, error: activeError } = await db.from("chatgpt_guest_reviews").select("id,exercise_token,status").eq("subject_hash", hash).in("status", ["pending", "grading"]).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (activeError) throw activeError;
  if (!active?.exercise_token) return { error: "No ready guest exercise was found. Start a new review." };
  const exercise = openExercise(active.exercise_token, hash);
  if (!exercise?.guestReviewId || exercise.guestReviewId !== active.id) return { error: "This guest exercise is invalid or expired. Start a new one." };
  const { data: claim, error: claimError } = await db.rpc("chatgpt_guest_claim_review", { p_id: exercise.guestReviewId, p_subject_hash: hash });
  if (claimError) throw claimError;
  if (claim === "complete") {
    const { data, error } = await db.from("chatgpt_guest_reviews").select("result").eq("id", exercise.guestReviewId).eq("subject_hash", hash).single();
    if (error) throw error;
    return data.result;
  }
  if (claim === "grading") return { error: "This review is already being graded. Please retry shortly." };
  if (claim !== "claimed") return { error: "This guest exercise is invalid or expired. Start a new one." };

  try {
    const result = await gradeReview(ai, exercise.code, exercise.bugs, userReview);
    const { count, error: countError } = await db.from("chatgpt_guest_reviews").select("*", { count: "exact", head: true }).eq("subject_hash", hash).eq("status", "complete");
    if (countError) throw countError;
    const remaining = Math.max(0, GUEST_REVIEW_LIMIT - (count ?? 0) - 1);
    const finalResult = { ...result, guestReviewsRemaining: remaining, ...(remaining === 0 ? handoff() : {}) };
    const { data: saved, error: finishError } = await db.rpc("chatgpt_guest_finish_review", { p_id: exercise.guestReviewId, p_subject_hash: hash, p_result: finalResult });
    if (finishError || !saved) throw finishError || new Error("Could not save guest review");
    return finalResult;
  } catch (cause) {
    await db.rpc("chatgpt_guest_release_review", { p_id: exercise.guestReviewId, p_subject_hash: hash });
    throw cause;
  }
}
