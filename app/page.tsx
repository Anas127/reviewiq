import Link from "next/link";
import ExampleExercisePreview from "@/app/components/ExampleExercisePreview";
import GradedReviewDemo from "@/app/components/GradedReviewDemo";
import LandingAnalytics from "@/app/components/LandingAnalytics";
import RevealGradedDemoLink from "@/app/components/RevealGradedDemoLink";
import TrackedLink from "@/app/components/TrackedLink";
import { FREE_REVIEW_CREDITS, PRO_CREDITS_PER_BILLING_CYCLE, PRO_PRICE_USD } from "@/lib/credit-config";
import { createClient } from "@/lib/supabase/server";

const steps = [
  ["01", "Choose your context", "Pick a role, language, and experience level for your review."],
  ["02", "Review the change", "Read the code and explain the bugs and their impact in your review."],
  ["03", "Learn from the result", "Get a score and feedback on what you caught and missed. Revisit saved reviews in History."],
];

const primaryCta = "min-h-11 rounded-md bg-[#ff806a] px-5 py-3 text-sm font-bold text-[#1d1715] transition-colors hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const startHref = user ? "/review" : "/try";
  const proHref = user ? "/pricing" : "/login?mode=signup&redirect=%2Fpricing";

  return (
    <main className="landing-page min-h-screen overflow-x-clip bg-[#101418] text-[#f4f5f6]">
      <LandingAnalytics />
      <nav aria-label="Main navigation" className="mx-auto flex min-h-[4.75rem] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="text-xl font-extrabold tracking-[-0.06em]">Review<span className="text-[#ff806a]">IQ</span></Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/bootcamps" className="hidden text-sm font-semibold text-[#cbd3d7] hover:text-[#ff9a87] sm:block">For Training Programs</Link>
          {!user && <Link href="/login" className="text-sm text-[#aab2b8] hover:text-white">Sign in</Link>}
          <TrackedLink href={user ? startHref : "/try?from=nav"} event="hero_primary_clicked" eventProperties={{ location: "nav" }} className={primaryCta}>Try a review</TrackedLink>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-start gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="min-w-0">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-[#ff9a87]">Code review practice</p>
          <h1 className="landing-hero-title max-w-[18ch] font-semibold leading-[1.08] tracking-[-0.04em]">Would you approve this <span className="font-serif italic font-normal text-[#ff806a]">AI-generated code?</span></h1>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-[#b2bbc1] lg:text-lg">Practice on a code change with three planted bugs. Explain what could break, then get a score and feedback on what you caught and missed.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <RevealGradedDemoLink className={primaryCta}>See the feedback example <span aria-hidden="true" className="ml-2">↓</span></RevealGradedDemoLink>
            <TrackedLink href={user ? startHref : "/try?from=hero"} event="hero_secondary_clicked" eventProperties={{ location: "hero" }} className="inline-flex min-h-11 items-center rounded-md border border-[#ffffff35] px-5 py-3 text-sm font-semibold text-[#f4f5f6] transition-colors hover:border-[#ff806a] hover:text-[#ffab98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">Start free</TrackedLink>
            <p className="text-sm leading-relaxed text-[#aeb8be]">{FREE_REVIEW_CREDITS} free reviews on signup. No card required.</p>
          </div>
        </div>
        <ExampleExercisePreview />
      </section>

      <GradedReviewDemo startHref={user ? startHref : "/try?from=graded_demo"} />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:gap-10 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#ff927e]">Why review practice matters</p>
          <h2 className="landing-section-title mt-3 font-semibold leading-tight tracking-[-0.03em]">Would you catch the bug before approving the code?</h2>
        </div>
        <div className="max-w-[68ch] space-y-4 text-base leading-relaxed text-[#b2bbc1]">
          <p>When you use AI to write code, you still have to decide whether it works. ReviewIQ gives you practice making that call: inspect a change, find three planted bugs, and explain what could break.</p>
          <p>Get feedback on the bugs you caught and the ones you missed. Use your next review to put that feedback into practice.</p>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#ffffff12] bg-[#13191e] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#ff9a87]">How it works</p>
          <h2 className="landing-section-title mt-3 max-w-[28ch] font-semibold tracking-[-0.03em]">Practice catching failures before code is approved.</h2>
          <div className="mt-9 grid gap-8 border-t border-[#ffffff17] pt-7 sm:grid-cols-3">
            {steps.map(([number, title, body]) => <article key={number}>
              <p className="font-mono text-xs text-[#ff927e]">{number}</p>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-[#aab4ba]">{body}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#ff927e]">Practice at your level</p>
            <h2 className="landing-section-title mt-3 font-semibold tracking-[-0.03em]">Put your code-review skills to the test.</h2>
          </div>
          <div>
            <p className="max-w-[65ch] text-base leading-relaxed text-[#aab4ba]">Pick your language, role and experience level. Find the bugs, submit your review, and see how you scored.</p>
            <TrackedLink href={user ? startHref : "/try?from=practice_level"} event="free_plan_cta_clicked" eventProperties={{ location: "practice_level" }} className={`mt-5 inline-flex items-center ${primaryCta}`}>Test yourself free</TrackedLink>
            <p className="mt-2 text-sm leading-relaxed text-[#aab4ba]">{FREE_REVIEW_CREDITS} free reviews. No card required.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ffffff12] bg-[#13191e] px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#ff927e]">Pro</p>
            <h2 className="landing-section-title mt-3 font-semibold tracking-[-0.03em]">Catch what you missed last time.</h2>
            <p className="mt-3 max-w-[68ch] text-base leading-relaxed text-[#aab4ba]">Your first reviews show which bugs you overlook. Keep practicing with fresh exercises in your chosen language and level, then compare your findings with the feedback.</p>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-[#e0e4e6]">{PRO_CREDITS_PER_BILLING_CYCLE} reviews each billing cycle · {PRO_PRICE_USD}/month</p>
          </div>
          <Link href={proHref} className={`inline-flex items-center justify-center ${primaryCta}`}>Get Pro</Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-[#ffffff12] px-4 py-6 text-xs leading-relaxed text-[#aab4ba] sm:px-6 lg:px-10">
        <Link href="/" className="font-extrabold tracking-[-0.06em] text-[#d8dcde]">Review<span className="text-[#ff806a]">IQ</span></Link>
        <span>Code review practice for developers.</span>
        <Link href="/bootcamps" className="hover:text-white">For training programs</Link>
        <Link href="/privacy" className="hover:text-white">Privacy</Link>
        <span>© 2026 ReviewIQ</span>
      </footer>
    </main>
  );
}
