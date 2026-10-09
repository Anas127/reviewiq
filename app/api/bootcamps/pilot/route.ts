import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length <= maxLength ? cleaned : null;
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Please submit the form again." }, { status: 415 });
  }

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 8192) {
      return NextResponse.json({ error: "Your message is too long." }, { status: 413 });
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid payload");
    input = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const name = field(input.name, 120);
  const email = field(input.email, 254)?.toLowerCase();
  const organization = field(input.organization, 160);
  const cohortSize = field(input.cohortSize ?? "", 60);
  const message = field(input.message ?? "", 2000);
  const website = field(input.website ?? "", 200);
  const submissionId = field(input.submissionId, 36);
  const utmSource = field(input.utmSource ?? "", 120);
  const utmMedium = field(input.utmMedium ?? "", 120);
  const utmCampaign = field(input.utmCampaign ?? "", 120);

  if (website) return NextResponse.json({ error: "Please submit the form again." }, { status: 400 });
  if (!name || !email || !emailPattern.test(email) || !organization ||
      cohortSize === null || message === null || website === null ||
      !submissionId || !uuidPattern.test(submissionId) ||
      utmSource === null || utmMedium === null || utmCampaign === null) {
    return NextResponse.json({ error: "Please enter your name, a valid email, and your program name." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Bootcamp pilot storage is not configured");
    return NextResponse.json({ error: "We could not receive your request right now. Please try again later." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from("bootcamp_pilot_requests").insert({
    submission_id: submissionId,
    contact_name: name,
    email,
    organization,
    cohort_size: cohortSize || null,
    message: message || null,
    source: "bootcamps_page",
    utm_source: utmSource || null,
    utm_medium: utmMedium || null,
    utm_campaign: utmCampaign || null,
  });

  // A retry with the same submission ID already has a saved lead.
  if (error && error.code !== "23505") {
    console.error("Bootcamp pilot request storage failed", error.message);
    return NextResponse.json({ error: "We could not receive your request right now. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
