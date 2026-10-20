import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient, guestClaim, loadGuestAttempt } from "@/lib/guest/server";
import { GUEST_BUGS, GUEST_EXERCISE } from "@/lib/guest/exercise";
import { recordGuestEvent } from "@/lib/guest/events";

export default async function ClaimGuestResult() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=signin&redirect=%2Fguest%2Fclaim");
  const claim = await guestClaim();
  if (!claim) return <ClaimError title="Your save link expired" body="Return to your guest result and choose Save my result again." />;
  let attempt;
  try { attempt = await loadGuestAttempt(claim.hash); }
  catch { return <ClaimError title="We could not load your result" body="Refresh this page to retry saving your result." />; }
  if (!attempt || attempt.status !== "graded") return <ClaimError title="No graded result found" body="Finish the guest exercise before saving it." />;
  const confirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
  if (!confirmed) return <ClaimError title="Confirm your email to save this result" body="Open the confirmation link we sent you, then return here. Your guest result remains saved." />;
  if (attempt.claimed_user_id && attempt.claimed_user_id !== user.id)
    return <ClaimError title="This result belongs to another account" body="Sign in to the account that originally saved this result." />;
  try {
    const { error } = await adminClient().rpc("claim_guest_attempt", {
      p_session_hash: claim.hash, p_user_id: user.id,
      p_role: GUEST_EXERCISE.role, p_language: GUEST_EXERCISE.language, p_seniority: GUEST_EXERCISE.seniority,
      p_description: GUEST_EXERCISE.description, p_code: GUEST_EXERCISE.code, p_bugs: GUEST_BUGS,
    });
    if (error) throw error;
    const newAccount = claim.mode === "signup" && confirmed && Date.parse(user.created_at) >= Date.parse(attempt.created_at) - 120000;
    await recordGuestEvent(attempt, newAccount ? "signup_completed" : "guest_existing_account_signed_in", "", { user_id: user.id }).catch(() => undefined);
    await recordGuestEvent(attempt, "guest_result_saved", "", { user_id: user.id }).catch(() => undefined);
  } catch (error) {
    console.error("Guest result claim failed", error);
    await recordGuestEvent(attempt, "guest_flow_failed", "save", { failure_stage: "saving", error_code: "claim_failed" }).catch(() => undefined);
    return <ClaimError title="Your result could not be saved yet" body="Refresh this page to retry. Your guest review remains available." />;
  }
  redirect("/history?guest_saved=1");
}

function ClaimError({ title, body }: { title: string; body: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#101418] px-4 text-[#f4f5f6]"><div className="max-w-md rounded-xl border border-[#ffffff20] bg-[#151b20] p-7"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-3 text-base leading-relaxed text-[#b2bbc1]">{body}</p><div className="mt-6 flex gap-4"><Link href="/try" className="text-[#ff9a87] underline">Back to my result</Link><Link href="/login" className="text-[#ff9a87] underline">Sign in</Link></div></div></main>;
}
