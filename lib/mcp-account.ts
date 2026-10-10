import { randomUUID } from "crypto";
import OpenAI from "openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { openExercise, sealExercise } from "@/lib/exercise-token";
import { generateExercise, gradeReview, type ExerciseConfig } from "@/lib/review-engine";

export type McpAccount = {
  id: string;
  email?: string;
  db: SupabaseClient;
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("MCP account storage is not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function ai() {
  if (!process.env.OPENAI_API_KEY) throw new Error("Review grading is temporarily unavailable");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function authenticateMcpAccount(token: string): Promise<McpAccount | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowedClientId = process.env.REVIEWIQ_MCP_OAUTH_CLIENT_ID;
  const resource = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://reviewiq-ruby.vercel.app").replace(/\/$/, "")}/mcp`;
  if (!url || !anonKey || !allowedClientId || !token) return null;

  const db = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: claimsData, error: claimsError } = await db.auth.getClaims(token);
  if (claimsError || !claimsData?.claims ||
      claimsData.claims.client_id !== allowedClientId ||
      claimsData.claims.resource !== resource ||
      claimsData.claims.iss !== `${url.replace(/\/$/, "")}/auth/v1`) return null;
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user || userData.user.id !== claimsData.claims.sub) return null;
  return { id: userData.user.id, email: userData.user.email, db };
}

export async function accountStatus(account: McpAccount) {
  const { data, error } = await account.db.from("profiles").select("credits").eq("id", account.id).single();
  if (error) throw error;
  return { creditsRemaining: data.credits as number };
}

export async function accountStart(account: McpAccount, config: ExerciseConfig) {
  const { creditsRemaining } = await accountStatus(account);
  if (creditsRemaining < 1) return { error: "No review credits remain on this ReviewIQ account." };

  const db = admin();
  const { data: active, error: activeError } = await db.from("mcp_account_reviews").select("id,exercise_token,status").eq("user_id", account.id).in("status", ["pending", "grading"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (activeError) throw activeError;
  if (active?.status === "grading") return { error: "Your previous review is still being graded. Please retry shortly." };
  if (active?.exercise_token) {
    const existing = openExercise(active.exercise_token, account.id);
    if (existing && existing.mcpAccountReviewId === active.id) return { code: existing.code, instruction: "Submit your written findings for official ReviewIQ grading." };
  }
  if (active) await db.from("mcp_account_reviews").delete().eq("id", active.id).eq("user_id", account.id).eq("status", "pending");
  const id = randomUUID();
  const { error: insertError } = await db.from("mcp_account_reviews").insert({ id, user_id: account.id });
  if (insertError) throw insertError;
  try {
    const { code, bugs } = await generateExercise(ai(), config);
    const exerciseToken = sealExercise({ ...config, code, bugs, userId: account.id, mcpAccountReviewId: id });
    const { data: stored, error: storeError } = await db.from("mcp_account_reviews").update({ exercise_token: exerciseToken }).eq("id", id).eq("user_id", account.id).eq("status", "pending").select("id").single();
    if (storeError || !stored) throw storeError || new Error("Could not save account exercise");
    return { code, instruction: "Review this code and submit your written findings for official ReviewIQ grading." };
  } catch (error) {
    await db.from("mcp_account_reviews").delete().eq("id", id).eq("user_id", account.id).eq("status", "pending");
    throw error;
  }
}

export async function accountSubmit(account: McpAccount, userReview: string) {
  const db = admin();
  const { data: active, error: activeError } = await db.from("mcp_account_reviews").select("id,exercise_token").eq("user_id", account.id).in("status", ["pending", "grading"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (activeError) throw activeError;
  if (!active?.exercise_token) return { error: "No ready account exercise was found. Start a new review." };
  const exercise = openExercise(active.exercise_token, account.id);
  if (!exercise?.mcpAccountReviewId || exercise.mcpAccountReviewId !== active.id) return { error: "This exercise is invalid or expired. Start a new review." };
  const reviewId = exercise.mcpAccountReviewId;
  const { data: claim, error: claimError } = await db.rpc("mcp_claim_account_review", { p_id: reviewId, p_user_id: account.id });
  if (claimError) throw claimError;
  if (claim === "complete") {
    const { data, error } = await db.from("mcp_account_reviews").select("result").eq("id", reviewId).eq("user_id", account.id).single();
    if (error) throw error;
    return data.result;
  }
  if (claim === "grading") return { error: "This review is already being processed. Check your ReviewIQ history before trying again." };
  if (claim !== "claimed") return { error: "This exercise is invalid or expired. Start a new review." };

  let grading: Awaited<ReturnType<typeof gradeReview>>;
  try {
    grading = await gradeReview(ai(), exercise.code, exercise.bugs, userReview);
  } catch (error) {
    await db.rpc("mcp_release_account_review", { p_id: reviewId, p_user_id: account.id });
    throw error;
  }

  const { data: completed, error: completionError } = await account.db.rpc("complete_review", {
    p_role: exercise.role,
    p_language: exercise.language,
    p_seniority: exercise.seniority,
    p_code: exercise.code,
    p_bugs: exercise.bugs,
    p_user_review: userReview,
    p_score: grading.score,
    p_caught: grading.caught,
    p_missed: grading.missed,
    p_feedback: grading.feedback,
  });
  if (completionError) {
    await db.rpc("mcp_release_account_review", { p_id: reviewId, p_user_id: account.id });
    throw completionError;
  }
  if (!completed) {
    await db.rpc("mcp_release_account_review", { p_id: reviewId, p_user_id: account.id });
    return { error: "No review credits remain on this ReviewIQ account. No review credit was used." };
  }

  // The credit and review are already committed. Never release the claim here:
  // a retry must not charge the same exercise twice if final ledger storage fails.
  const [status, reviewCount] = await Promise.allSettled([
    accountStatus(account),
    account.db.from("reviews").select("*", { count: "exact", head: true }).eq("user_id", account.id),
  ]);
  const result = {
    ...grading,
    creditsRemaining: status.status === "fulfilled" ? status.value.creditsRemaining : null,
    reviewNumber: reviewCount.status === "fulfilled" && !reviewCount.value.error ? reviewCount.value.count : null,
  };
  const { data: saved, error: finishError } = await db.rpc("mcp_finish_account_review", { p_id: reviewId, p_user_id: account.id, p_result: result });
  if (finishError || !saved) throw finishError || new Error("Review saved but MCP result storage failed");
  return result;
}
