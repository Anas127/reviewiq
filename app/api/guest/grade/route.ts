import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminClient, guestSession, loadGuestAttempt } from "@/lib/guest/server";
import { GUEST_BUGS, GUEST_EXERCISE } from "@/lib/guest/exercise";
import { gradeReview } from "@/lib/review-engine";
import { recordGuestEvent } from "@/lib/guest/events";
import { readJsonLimited } from "@/lib/guest/request";

export const runtime = "nodejs";
export const maxDuration = 90;

async function recordFailure(sessionHash: string, code: string) {
  try {
    const attempt = await loadGuestAttempt(sessionHash);
    if (attempt) await recordGuestEvent(attempt, "guest_flow_failed", code, { failure_stage: "grading", error_code: code });
  } catch {}
}

export async function POST(request: Request) {
  const session = await guestSession();
  if (!session) return NextResponse.json({ code: "session_missing", error: "Your guest session expired. Reload the page." }, { status: 401 });
  let body: unknown;
  try { body = await readJsonLimited(request, 10000); }
  catch (error) { const tooLong = error instanceof Error && error.message === "body_too_large"; await recordFailure(session.hash, tooLong ? "review_too_long" : "invalid_request"); return NextResponse.json({ code: tooLong ? "review_too_long" : "invalid_request", error: tooLong ? "Keep your review under 6,000 characters." : "Invalid submission." }, { status: tooLong ? 413 : 400 }); }
  const review = body && typeof body === "object" && "review" in body ? body.review : undefined;
  if (typeof review !== "string" || review.trim().length < 40 || review.length > 6000) {
    await recordFailure(session.hash, "invalid_review");
    return NextResponse.json({ code: "invalid_review", error: "Write at least 40 and at most 6,000 characters before submitting." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ code: "grading_unavailable", error: "Grading is temporarily unavailable. Try again later." }, { status: 503 });
  try {
    const attempt = await loadGuestAttempt(session.hash);
    if (!attempt) return NextResponse.json({ code: "session_missing", error: "Your guest session expired. Reload the page." }, { status: 401 });
    if (attempt.claimed_user_id) return NextResponse.json({ code: "result_saved", error: "This guest result is saved. Sign in to start your next review." }, { status: 409 });
    const requestId = randomUUID();
    const configuredCap = Number(process.env.GUEST_GRADING_MAX_TOTAL || 250);
    const cap = Number.isFinite(configuredCap) ? Math.max(0, Math.min(10000, Math.floor(configuredCap))) : 0;
    const { data: reservation, error: reserveError } = await adminClient().rpc("reserve_guest_grading", {
      p_session_hash: session.hash, p_review: review.trim(), p_request_id: requestId, p_max_total: cap,
    });
    if (reserveError) throw reserveError;
    if (reservation?.state === "graded") return NextResponse.json({ attemptId: attempt.id, grading: reservation.grading });
    if (reservation?.state !== "reserved") {
      const code = reservation?.state || "grading_unavailable";
      const retryable = code === "busy";
      if (!retryable) await recordFailure(session.hash, code);
      return NextResponse.json({ code, error: retryable ? "This review is being graded. Wait a moment, then check again." : "Guest grading is unavailable for this session." }, { status: retryable ? 409 : 429 });
    }
    await recordGuestEvent(attempt, "guest_review_submitted").catch(() => undefined);
    try {
      const grading = await gradeReview(new OpenAI({ apiKey, timeout: 60000, maxRetries: 0 }), GUEST_EXERCISE.code, GUEST_BUGS, review.trim(), { maxCompletionTokens: 1500 });
      const { data: finished, error: finishError } = await adminClient().rpc("finish_guest_grading", {
        p_session_hash: session.hash, p_request_id: requestId, p_grading: grading,
      });
      if (finishError || !finished) throw finishError || new Error("Guest grading reservation expired");
      return NextResponse.json({ attemptId: attempt.id, grading });
    } catch (error) {
      console.error("Guest grading failed", error);
      await adminClient().rpc("fail_guest_grading", { p_session_hash: session.hash, p_request_id: requestId });
      await recordGuestEvent(attempt, "guest_flow_failed", "grading", { failure_stage: "grading", error_code: "grading_failed" }).catch(() => undefined);
      return NextResponse.json({ code: "grading_failed", error: "We could not grade that review. Your attempt is saved; please retry." }, { status: 502 });
    }
  } catch (error) {
    console.error("Guest grading reservation failed", error);
    return NextResponse.json({ code: "grading_unavailable", error: "Grading is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
