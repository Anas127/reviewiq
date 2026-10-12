import Link from "next/link";
import ExampleExercisePreview from "@/app/components/ExampleExercisePreview";
import GradedReviewDemo from "@/app/components/GradedReviewDemo";
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
  const proHref = user ? "/pricing" : "/login?mode=signup&redirect=%2Fpricing";

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
      <GradedReviewDemo />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-24">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#ff927e]">Why review practice matters</p><h2 className="mt-3 text-[31px] font-semibold leading-tight tracking-[-1.1px] sm:text-[38px]">Would you catch the bug before approving the code?</h2></div>
        <div className="max-w-2xl"><p className="text-[14px] leading-7 text-[#b2bbc1]">When you use AI to write code, you still have to decide whether it works. ReviewIQ gives you practice making that call: inspect a change, find three planted bugs, and explain what could break.</p><p className="mt-4 text-[14px] leading-7 text-[#b2bbc1]">Get feedback on the bugs you caught and the ones you missed. Use your next review to put that feedback into practice.</p></div>
      </section>
      <section id="how-it-works" className="border-y border-[#ffffff12] bg-[#13191e] px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">How it works</p>
          <h2 className="mt-3 max-w-2xl text-[30px] font-semibold tracking-[-1px] sm:text-[38px]">Practice catching failures before code is approved.</h2>
          <div className="mt-9 grid gap-8 border-t border-[#ffffff17] pt-7 sm:grid-cols-3">{steps.map(([number, title, body]) => <article key={number}><p className="font-mono text-[11px] text-[#ff927e]">{number}</p><h3 className="mt-4 text-[16px] font-semibold">{title}</h3><p className="mt-2 max-w-sm text-[13px] leading-6 text-[#aab4ba]">{body}</p></article>)}</div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Practice at your level</p><h2 className="mt-3 text-[30px] font-semibold tracking-[-1px]">Put your code-review skills to the test.</h2></div>
          <div><p className="max-w-2xl text-[13px] leading-6 text-[#aab4ba]">Pick your language, role and experience level. Find the bugs, submit your review, and see how you scored.</p><TrackedLink href={startHref} event="free_plan_cta_clicked" eventProperties={{ location: "practice_level" }} className="mt-5 inline-block rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#1d1715] hover:bg-[#ff9a87]">Test yourself free</TrackedLink><p className="mt-2 text-[12px] text-[#aab4ba]">{FREE_REVIEW_CREDITS} free reviews. No card required.</p></div>
        </div>
      </section>
      <section className="border-y border-[#ffffff12] bg-[#13191e] px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Pro</p><h2 className="mt-3 text-[30px] font-semibold tracking-[-1px]">Catch what you missed last time.</h2><p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#aab4ba]">Your first reviews show which bugs you overlook. Keep practicing with fresh exercises in your chosen language and level, then compare your findings with the feedback.</p><p className="mt-4 text-[12px] font-semibold text-[#e0e4e6]">{PRO_CREDITS_PER_BILLING_CYCLE} reviews each billing cycle · {PRO_PRICE_USD}/month</p></div>
          <Link href={proHref} className="rounded-md bg-[#ff806a] px-5 py-3 text-center text-[13px] font-bold text-[#1d1715] hover:bg-[#ff9a87]">Get Pro</Link>
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ffffff12] px-6 py-6 text-[11px] text-[#89949b] lg:px-10"><Link href="/" className="font-extrabold tracking-[-.7px] text-[#d8dcde]">Review<span className="text-[#ff806a]">IQ</span></Link><span>Code review practice for developers.</span><Link href="/bootcamps" className="hover:text-white">For training programs</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><span>© 2026 ReviewIQ</span></footer>
    </main>
  );
}
