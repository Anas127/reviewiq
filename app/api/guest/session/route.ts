import { NextResponse } from "next/server";
import { GUEST_COOKIE, adminClient, clientIpHash, cookieOptions, guestSession, loadGuestAttempt, newGuestCookie, sanitizeAttribution } from "@/lib/guest/server";
import { GUEST_EXERCISE_ID } from "@/lib/guest/exercise";
import { readJsonLimited } from "@/lib/guest/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    const current = await guestSession();
    if (current) {
      const attempt = await loadGuestAttempt(current.hash);
      if (attempt) return NextResponse.json(attempt.claimed_user_id
        ? { status: "claimed" }
        : { attemptId: attempt.id, status: attempt.status, grading: attempt.grading });
    }
    const input = await readJsonLimited(request, 2048).catch(() => ({}));
    const attribution = sanitizeAttribution(input);
    attribution.original_source = attribution.utm_source || attribution.referrer || "direct";
    attribution.utm_campaign ||= "(none)";
    const ipHash = clientIpHash(request);
    const internalIps = (process.env.GUEST_INTERNAL_IP_HASHES || "").split(",").map((value) => value.trim());
    attribution.test_status = process.env.NODE_ENV !== "production" || internalIps.includes(ipHash)
      || attribution.utm_campaign === "guest_flow_test" ? "internal" : "live";
    attribution.device_type = /Mobile|Android|iPhone/i.test(request.headers.get("user-agent") || "") ? "mobile" : "desktop";
    const cookie = newGuestCookie();
    const { data, error } = await adminClient().rpc("create_guest_attempt", { p_session_hash: cookie.hash,
      p_ip_hash: ipHash, p_exercise_id: GUEST_EXERCISE_ID, p_attribution: attribution });
    if (error || !data) {
      const limited = error?.message.includes("guest_session_rate_limit");
      return NextResponse.json({ code: limited ? "session_rate_limit" : "session_unavailable" }, { status: limited ? 429 : 503 });
    }
    const response = NextResponse.json({ attemptId: data.id, status: data.status, grading: data.grading });
    response.cookies.set(GUEST_COOKIE, cookie.signed, cookieOptions());
    return response;
  } catch (error) {
    console.error("Guest session error", error);
    return NextResponse.json({ code: "session_unavailable" }, { status: 503 });
  }
}
