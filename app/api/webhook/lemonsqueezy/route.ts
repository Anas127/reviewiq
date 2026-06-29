import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  // Verify webhook signature
  const hmac = crypto
    .createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (hmac !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;

  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const order = payload.data?.attributes;
  const status = order?.status;

  if (status !== "paid") {
    return NextResponse.json({ received: true });
  }

  // Get user email from order
  const email = order?.user_email;
  const productName = payload.data?.attributes?.first_order_item?.product_name ?? "";

  // Determine credits to add
  const creditsToAdd = productName.includes("30") ? 30 : 10;

  // Find user by email and add credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, credits")
    .eq("email", email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await supabase
    .from("profiles")
    .update({ credits: profile.credits + creditsToAdd })
    .eq("id", profile.id);

  return NextResponse.json({ received: true });
}