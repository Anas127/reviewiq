import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  const { authorization_id: authorizationId } = await searchParams;
  if (!authorizationId || authorizationId.length > 256) {
    return <main className="min-h-screen bg-[#101418] p-8 text-[#f4f5f6]">Invalid authorization request.</main>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`)}`);

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !data) {
    return <main className="min-h-screen bg-[#101418] p-8 text-[#f4f5f6]">The connection request is invalid or expired. Return to ChatGPT and try connecting again.</main>;
  }
  if (!("authorization_id" in data)) redirect(data.redirect_url);

  const scopes = data.scope?.split(" ").filter(Boolean) ?? [];
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101418] px-5 py-12 text-[#f4f5f6]">
      <section className="w-full max-w-lg rounded-xl border border-[#ffffff24] bg-[#171e23] p-7 shadow-2xl sm:p-9">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px]">Review<span className="text-[#ff806a]">IQ</span></Link>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">Account connection</p>
        <h1 className="mt-3 text-[29px] font-semibold tracking-tight">Connect {data.client.name}?</h1>
        <p className="mt-4 text-[13px] leading-6 text-[#b2bbc1]">This lets {data.client.name} use your ReviewIQ account to start reviews, submit your findings, and see your credit balance and grading feedback. A credit is used only after a review is graded and saved.</p>
        <div className="mt-6 rounded-md border border-[#ffffff16] bg-[#101519] p-4 text-[12px] leading-6 text-[#c8d0d5]">
          <p>Signed in as <strong className="text-white">{user.email}</strong></p>
          {scopes.length > 0 && <p className="mt-2">Requested permissions: {scopes.join(", ")}</p>}
          <p className="mt-2 break-all text-[#9ba6ad]">Return to: {data.redirect_uri}</p>
        </div>
        <form action="/api/oauth/decision" method="POST" className="mt-7 flex flex-wrap gap-3">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button type="submit" name="decision" value="approve" className="rounded-md bg-[#ff806a] px-5 py-3 text-[12px] font-bold text-[#201715] hover:bg-[#ff9a87]">Connect account</button>
          <button type="submit" name="decision" value="deny" className="rounded-md border border-[#ffffff30] px-5 py-3 text-[12px] font-semibold text-[#d4dce0] hover:border-[#ff806a]">Cancel</button>
        </form>
        <p className="mt-6 text-[11px] leading-5 text-[#94a1a8]">You can disconnect ReviewIQ from ChatGPT later.</p>
      </section>
    </main>
  );
}
