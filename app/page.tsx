import Link from "next/link";
import ExampleExercisePreview from "@/app/components/ExampleExercisePreview";
import LandingAnalytics from "@/app/components/LandingAnalytics";
import TrackedLink from "@/app/components/TrackedLink";
import { FREE_REVIEW_CREDITS, PRO_CREDITS_PER_BILLING_CYCLE, PRO_PRICE_USD } from "@/lib/credit-config";
import { createClient } from "@/lib/supabase/server";

const steps = [
  ["01", "Choose your context", "Pick a role, language, and experience level for your review."],
  ["02", "Review the change", "Read the code and explain the bugs and their impact in your review."],
  ["03", "Learn from the result", "Get a score and feedback on what you caught and missed. Revisit saved reviews in History."],
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const startHref = user ? "/review" : "/login?mode=signup&redirect=%2Freview";

  return (
    <main className="min-h-screen overflow-hidden bg-[#101418] text-[#f4f5f6]">
      <LandingAnalytics />
      <nav aria-label="Main navigation" className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-10">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px]">Review<span className="text-[#ff806a]">IQ</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/bootcamps" className="hidden text-[12px] font-semibold text-[#cbd3d7] hover:text-[#ff9a87] sm:block">For Training Programs</Link>
          {!user && <Link href="/login" className="text-[12px] text-[#aab2b8] hover:text-white">Sign in</Link>}
          <TrackedLink href={startHref} event="hero_primary_clicked" eventProperties={{ location: "nav" }} className="rounded-md bg-[#ff806a] px-3 py-2.5 text-[12px] font-bold text-[#1d1715] hover:bg-[#ff9a87]">Try a review</TrackedLink>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl items-start gap-8 px-6 pb-16 pt-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-12 lg:px-10 lg:pb-24 lg:pt-20">
        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">Code review practice</p>
          <h1 className="max-w-[620px] text-[40px] font-semibold leading-[1.08] tracking-[-2px] sm:text-[56px] lg:text-[62px]">Would you approve this <span className="font-serif italic font-normal text-[#ff806a]">AI-generated code?</span></h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 text-[#b2bbc1]">Practice on a code change with three planted bugs. Explain what could break, then get a score and feedback on what you caught and missed.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <TrackedLink href={startHref} event="hero_primary_clicked" eventProperties={{ location: "hero" }} className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#1d1715] transition hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">Try your first review <span aria-hidden="true" className="ml-2">↗</span></TrackedLink>
            <p className="text-[12px] leading-5 text-[#aeb8be]">{FREE_REVIEW_CREDITS} free reviews on signup. No card required.</p>
          </div>
        </div>
        <ExampleExercisePreview />
      </section>
      <section id="how-it-works" className="border-y border-[#ffffff12] bg-[#13191e] px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">How it works</p>
          <h2 className="mt-3 max-w-2xl text-[30px] font-semibold tracking-[-1px] sm:text-[38px]">Practice catching failures before code is approved.</h2>
          <div className="mt-9 grid gap-8 border-t border-[#ffffff17] pt-7 sm:grid-cols-3">{steps.map(([number, title, body]) => <article key={number}><p className="font-mono text-[11px] text-[#ff927e]">{number}</p><h3 className="mt-4 text-[16px] font-semibold">{title}</h3><p className="mt-2 max-w-sm text-[13px] leading-6 text-[#aab4ba]">{body}</p></article>)}</div>
        </div>
      </section>
      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-6 py-16 sm:flex-row sm:items-center lg:px-10">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">Keep practicing</p><h2 className="mt-3 text-[30px] font-semibold tracking-[-1px]">Start with {FREE_REVIEW_CREDITS} free reviews.</h2><p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#aab4ba]">Pro is {PRO_PRICE_USD} per month and adds {PRO_CREDITS_PER_BILLING_CYCLE} reviews each billing cycle. <Link href="/pricing" className="text-[#ff9a87] underline underline-offset-4 hover:text-white">See plans and billing details.</Link></p></div>
        <TrackedLink href={startHref} event="hero_primary_clicked" eventProperties={{ location: "bottom" }} className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#1d1715] hover:bg-[#ff9a87]">Try your first review</TrackedLink>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ffffff12] px-6 py-6 text-[11px] text-[#89949b] lg:px-10"><Link href="/" className="font-extrabold tracking-[-.7px] text-[#d8dcde]">Review<span className="text-[#ff806a]">IQ</span></Link><span>Code review practice for developers.</span><Link href="/bootcamps" className="hover:text-white">For training programs</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><span>© 2026 ReviewIQ</span></footer>
    </main>
  );
}
