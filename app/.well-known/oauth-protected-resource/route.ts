import { NextResponse } from "next/server";

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reviewiq-ruby.vercel.app";
  if (!supabaseUrl) return NextResponse.json({ error: "OAuth is not configured" }, { status: 503 });
  return NextResponse.json({
    resource: `${siteUrl.replace(/\/$/, "")}/mcp`,
    authorization_servers: [`${supabaseUrl.replace(/\/$/, "")}/auth/v1`],
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
