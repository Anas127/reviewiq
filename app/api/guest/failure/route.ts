import { NextResponse } from "next/server";
import { guestSession, loadGuestAttempt } from "@/lib/guest/server";
import { recordGuestEvent } from "@/lib/guest/events";
import { readJsonLimited } from "@/lib/guest/request";

const codes = new Set(["email_signup_failed", "password_signin_failed", "google_signin_failed"]);
export async function POST(request: Request) {
  try {
    const input = await readJsonLimited(request, 256);
    const code = input && typeof input === "object" && "code" in input ? input.code : undefined;
    if (typeof code !== "string" || !codes.has(code)) return NextResponse.json({ code: "invalid_code" }, { status: 400 });
    const session = await guestSession();
    const attempt = session && await loadGuestAttempt(session.hash);
    if (!attempt) return NextResponse.json({ code: "session_missing" }, { status: 401 });
    await recordGuestEvent(attempt, "guest_flow_failed", code, { failure_stage: "authentication", error_code: code });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ code: "event_unavailable" }, { status: 503 }); }
}
