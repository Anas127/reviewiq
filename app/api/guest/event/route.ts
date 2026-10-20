import { NextResponse } from "next/server";
import { guestSession, loadGuestAttempt } from "@/lib/guest/server";
import { recordGuestEvent } from "@/lib/guest/events";
import { readJsonLimited } from "@/lib/guest/request";

const allowed = new Set(["guest_exercise_viewed", "guest_exercise_started", "guest_result_viewed", "guest_save_results_clicked"]);
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 256) return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    const input = await readJsonLimited(request, 256);
    const event = input && typeof input === "object" && "event" in input ? input.event : undefined;
    if (typeof event !== "string" || !allowed.has(event)) return NextResponse.json({ code: "invalid_event" }, { status: 400 });
    const session = await guestSession();
    const attempt = session && await loadGuestAttempt(session.hash);
    if (!attempt) return NextResponse.json({ code: "session_missing" }, { status: 401 });
    if ((event === "guest_result_viewed" || event === "guest_save_results_clicked") && attempt.status !== "graded")
      return NextResponse.json({ code: "result_unavailable" }, { status: 409 });
    await recordGuestEvent(attempt, event);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ code: "event_unavailable" }, { status: 503 });
  }
}
