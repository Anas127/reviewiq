import { NextResponse } from "next/server";
import { CLAIM_COOKIE, claimCookie, cookieOptions, guestSession, loadGuestAttempt } from "@/lib/guest/server";
import { recordGuestEvent } from "@/lib/guest/events";
import { readJsonLimited } from "@/lib/guest/request";

export async function POST(request: Request) {
  const session = await guestSession();
  const attempt = session && await loadGuestAttempt(session.hash);
  if (!attempt || attempt.status !== "graded" || attempt.claimed_user_id) return NextResponse.json({ code: "result_unavailable" }, { status: 409 });
  const body = await readJsonLimited(request, 256).catch(() => ({}));
  const mode = body && typeof body === "object" && "mode" in body && body.mode === "signin" ? "signin" : "signup";
  if (mode === "signup") await recordGuestEvent(attempt, "guest_save_results_clicked").catch(() => undefined);
  const response = NextResponse.json({ redirect: `/login?mode=${mode}&redirect=%2Fguest%2Fclaim` });
  response.cookies.set(CLAIM_COOKIE, claimCookie(session!.hash, mode), cookieOptions());
  return response;
}
