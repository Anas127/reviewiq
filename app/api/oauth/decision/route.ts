import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid authorization request" }, { status: 403 });
  }
  const form = await request.formData();
  const authorizationId = form.get("authorization_id");
  const decision = form.get("decision");
  if (typeof authorizationId !== "string" || !authorizationId || authorizationId.length > 256 ||
      (decision !== "approve" && decision !== "deny")) {
    return NextResponse.json({ error: "Invalid authorization request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const target = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(target)}`, request.url), { status: 303 });
  }

  const result = decision === "approve"
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId);
  if (result.error || !result.data) {
    return NextResponse.json({ error: "The connection request expired. Return to ChatGPT and try again." }, { status: 400 });
  }
  return NextResponse.redirect(result.data.redirect_url, { status: 303 });
}
