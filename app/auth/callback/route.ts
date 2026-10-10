import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/review";

  if (searchParams.has("error")) {
    const login = new URL("/login", origin);
    login.searchParams.set("auth_error", "1");
    if (safeNext.startsWith("/oauth/consent?authorization_id=")) login.searchParams.set("redirect", safeNext);
    return NextResponse.redirect(login);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL("/login", origin);
      login.searchParams.set("auth_error", "1");
      if (safeNext.startsWith("/oauth/consent?authorization_id=")) login.searchParams.set("redirect", safeNext);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
