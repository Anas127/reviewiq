import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { GUEST_EXERCISE_ID, GUEST_FLOW_VERSION } from "@/lib/guest/exercise";

export const GUEST_COOKIE = "reviewiq_guest_session";
export const CLAIM_COOKIE = "reviewiq_guest_claim";
const COOKIE_AGE = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.GUEST_SESSION_SECRET || process.env.EXERCISE_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error("Guest session secret is not configured");
  return value;
}

export function adminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Service role key is not configured");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hashValue(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }
function sign(value: string) { return `${value}.${hashValue(value)}`; }
function verify(value: string | undefined) {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const raw = value.slice(0, dot);
  const supplied = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(hashValue(raw));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? raw : null;
}

export async function guestSession() {
  const raw = verify((await cookies()).get(GUEST_COOKIE)?.value);
  return raw && /^[a-f0-9]{64}$/.test(raw) ? { raw, hash: hashValue(raw) } : null;
}

export async function guestClaim() {
  const session = await guestSession();
  const raw = verify((await cookies()).get(CLAIM_COOKIE)?.value);
  if (!session || !raw) return null;
  const [sessionHash, until, mode] = raw.split(":");
  return sessionHash === session.hash && Number(until) > Date.now() && (mode === "signup" || mode === "signin")
    ? { ...session, mode } : null;
}

export function newGuestCookie() {
  const raw = randomBytes(32).toString("hex");
  return { signed: sign(raw), hash: hashValue(raw) };
}

export function cookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: COOKIE_AGE };
}

export function claimCookie(sessionHash: string, mode: "signup" | "signin") { return sign(`${sessionHash}:${Date.now() + COOKIE_AGE * 1000}:${mode}`); }

export function clientIpHash(request: Request) {
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || (process.env.NODE_ENV !== "production" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : null)
    || "unknown";
  return hashValue(`ip:${ip}`);
}

export function sanitizeAttribution(value: unknown) {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const keys = ["utm_source", "utm_campaign", "utm_medium", "referrer", "cta_placement", "anonymous_id", "test_status"] as const;
  const result: Record<string, string> = {};
  for (const key of keys) {
    const item = source[key];
    if (typeof item === "string" && item.length <= 200 && /^[\w .:/?&=-]+$/.test(item)) result[key] = item;
  }
  if (result.anonymous_id && result.anonymous_id.length < 16) delete result.anonymous_id;
  result.flow_version = GUEST_FLOW_VERSION;
  result.exercise_id = GUEST_EXERCISE_ID;
  result.test_status = "live";
  return result;
}

export type GuestAttempt = {
  id: string; session_hash: string; exercise_id: string; status: "ready" | "grading" | "graded";
  grading: Record<string, unknown> | null; attribution: Record<string, string>;
  claimed_user_id: string | null; created_at: string;
};

export async function loadGuestAttempt(sessionHash: string): Promise<GuestAttempt | null> {
  const { data, error } = await adminClient().from("guest_attempts").select("id,session_hash,exercise_id,status,grading,attribution,claimed_user_id,created_at").eq("session_hash", sessionHash).maybeSingle();
  if (error) throw error;
  return data as GuestAttempt | null;
}
