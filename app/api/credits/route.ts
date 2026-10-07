import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ credits: 0, completedReviews: 0, userId: null });

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({ credits: profile?.credits ?? 0, completedReviews: count ?? 0, userId: user.id });
}
