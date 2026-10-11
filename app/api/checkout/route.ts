import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_GUMROAD_URL;
  if (!configuredUrl) return NextResponse.redirect(new URL("/pricing", request.url));

  const checkoutUrl = new URL(configuredUrl);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) checkoutUrl.searchParams.set("email", user.email);

  const response = NextResponse.redirect(checkoutUrl, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
