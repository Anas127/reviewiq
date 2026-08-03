import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!signature || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const hmac = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(hmac, "hex");
  const actual = Buffer.from(signature, "hex");

  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

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

  const email = order?.user_email;
  const productName =
    payload.data?.attributes?.first_order_item?.product_name ?? "";

  const creditsToAdd = productName.includes("30") ? 30 : 10;

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
