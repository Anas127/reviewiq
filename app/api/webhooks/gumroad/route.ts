import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function value(form: FormData, ...keys: string[]) {
  for (const key of keys) {
    const item = form.get(key);
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return "";
}

async function gumroadGet<T>(path: string): Promise<T | null> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) throw new Error("GUMROAD_ACCESS_TOKEN is not configured");
  const url = new URL("https://api.gumroad.com/v2/" + path);
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function POST(request: Request) {
  const secret = process.env.GUMROAD_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const url = new URL(request.url);
  const suppliedSecret = url.searchParams.get("secret") ?? "";
  if (!safeEqual(suppliedSecret, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  let form: FormData;
  if (contentType.includes("application/json")) {
    const payload = await request.json() as Record<string, unknown>;
    form = new FormData();
    for (const [key, item] of Object.entries(payload)) {
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        form.set(key, String(item));
      }
    }
  } else {
    form = await request.formData();
  }
  const saleId = value(form, "sale_id");
  const subscriptionId = value(form, "subscription_id");
  const email = value(form, "email", "buyer_email").toLowerCase();
  const productIds = ["product_id", "permalink", "product_permalink"].map((key) => value(form, key));
  const expectedProduct = process.env.GUMROAD_PRODUCT_ID;
  const test = value(form, "test").toLowerCase() === "true";
  if (test) return NextResponse.json({ received: true, test: true });
  if (!email || !expectedProduct || !productIds.some((productId) => safeEqual(productId, expectedProduct))) {
    return NextResponse.json({ error: "Invalid product or buyer" }, { status: 400 });
  }

  const eventType = (
    value(form, "event_type", "event_name", "type", "resource_name") ||
    url.searchParams.get("event_type") ||
    ""
  ).toLowerCase();
  const cancelled = value(form, "cancelled").toLowerCase() === "true";
  const ended = value(form, "subscription_ended").toLowerCase() === "true";
  const restarted = value(form, "subscription_restarted").toLowerCase() === "true";
  const isCancellation = cancelled || eventType.includes("cancel");
  const isEnded = ended || eventType.includes("ended");
  const isRestarted = restarted || eventType.includes("restart");
  const resolvedType = isRestarted ? "subscription_restarted" : isEnded ? "subscription_ended" : isCancellation ? "cancellation" : "sale";
  if (!subscriptionId || (resolvedType === "sale" && !saleId)) {
    return NextResponse.json({ error: "Missing sale or subscription identifier" }, { status: 400 });
  }

  if (resolvedType === "sale") {
    const verification = await gumroadGet<{ success?: boolean; sale?: Record<string, unknown> }>("sales/" + encodeURIComponent(saleId));
    const sale = verification?.sale;
    const verifiedProducts = [sale?.product_id, sale?.product_permalink, sale?.permalink].map((item) => String(item ?? ""));
    if (!verification?.success || !sale ||
        !verifiedProducts.some((productId) => safeEqual(productId, expectedProduct)) ||
        String(sale.subscription_id ?? "") !== subscriptionId ||
        String(sale.email ?? "").toLowerCase() !== email ||
        sale.refunded === true || sale.chargebacked === true) {
      return NextResponse.json({ error: "Sale could not be verified" }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Webhook storage is not configured" }, { status: 503 });
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const eventFingerprint = createHash("sha256")
    .update([resolvedType, saleId, subscriptionId, email, value(form, "cancelled_at", "timestamp")].join(":"))
    .digest("hex");
  const eventId = resolvedType === "sale" ? "sale:" + saleId : resolvedType + ":" + subscriptionId + ":" + eventFingerprint;
  const { data, error } = await supabase.rpc("handle_gumroad_event", {
    p_event_id: eventId,
    p_event_type: resolvedType,
    p_email: email,
    p_sale_id: saleId || null,
    p_subscription_id: subscriptionId,
    p_credits: resolvedType === "sale" ? 10 : 0,
  });
  if (error) {
    console.error("Gumroad webhook storage failed", error.message);
    return NextResponse.json({ error: "Could not process event" }, { status: 500 });
  }
  if (data === "unknown_subscription") {
    return NextResponse.json({ error: "Subscription is not associated with a verified sale" }, { status: 401 });
  }
  return NextResponse.json({ received: true, result: data });
}
