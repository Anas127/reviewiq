import type { Metadata } from "next";
import Link from "next/link";
import GradedReviewDemo from "@/app/components/GradedReviewDemo";
import TrackedLink from "@/app/components/TrackedLink";
import BootcampsAnalytics from "./BootcampsAnalytics";
import PilotForm from "./PilotForm";
import { FREE_REVIEW_CREDITS } from "@/lib/credit-config";
import { LANGUAGES } from "@/lib/practice-options";

export const metadata: Metadata = {
  title: "Code Review Practice for Bootcamps | ReviewIQ",
  description: "Help students move from writing code to reviewing it. Explore realistic pull requests, feedback, and a small ReviewIQ cohort pilot for your training program.",
  openGraph: {
    title: "Code Review Practice for Bootcamps | ReviewIQ",
    description: "Give developer training cohorts realistic pull requests to review and feedback on what they caught and missed. Request a small pilot.",
    type: "website",
  },
};

const capabilities = [
  ["01", "Read unfamiliar code", "Practice understanding changes in a codebase the student didn't write."],
  ["02", "Spot meaningful issues", "Look for correctness, security, and edge-case problems inside realistic changes."],
  ["03", "Explain the reasoning", "Write review comments and learn why an issue matters."],
];

const steps = [
  ["01", "Students start practicing", "Students create individual accounts and choose a supported role, language, and experience level."],
  ["02", "Students review realistic changes", "They examine code, identify potential problems, and submit their review."],
  ["03", "Students learn from the result", "ReviewIQ gives feedback on caught and missed issues. Students can practice again and revisit their results."],
];

const useCases = [
  ["Weekly review exercises", "Add review practice alongside programming assignments."],
  ["Capstone preparation", "Help students become comfortable examining unfamiliar changes before larger collaborative projects."],
  ["Independent practice", "Let students revisit weak areas through repeated review exercises."],
];

const pilotSteps = [
  ["01", "Choose a small group", "Begin with approximately 5–10 students from your program."],
  ["02", "Let students practice", "Students use individual ReviewIQ accounts to review realistic pull requests and receive feedback."],
  ["03", "Evaluate the experience together", "Discuss student engagement, usefulness, and feedback with the ReviewIQ founder by email before considering a larger rollout."],
];

function PilotLink({ children, placement, className }: { children: React.ReactNode; placement: string; className: string }) {
  return <TrackedLink href="#pilot-form" event="bootcamps_pilot_cta_clicked" eventProperties={{ placement }} className={className}>{children}</TrackedLink>;
}

export default function BootcampsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#101418] text-[#f4f5f6]">
      <BootcampsAnalytics />
      <nav aria-label="Bootcamps navigation" className="relative z-10 mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-10">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px]">Review<span className="text-[#ff806a]">IQ</span></Link>
        <div className="order-3 flex w-full items-center gap-5 text-[12px] font-medium text-[#aab2b8] sm:order-none sm:w-auto sm:gap-7 sm:text-[13px]">
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="#for-students" className="transition hover:text-white">For your students</a>
          <a href="#pilot-form" className="transition hover:text-white sm:hidden">Request a pilot</a>
        </div>
        <PilotLink placement="navigation" className="rounded-md bg-[#ff806a] px-4 py-2.5 text-[12px] font-bold text-[#211916] transition hover:bg-[#ff9a87]">Request a pilot <span aria-hidden="true">↗</span></PilotLink>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[.95fr_1.05fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div>
          <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.19em] text-[#ff9a87]"><span className="h-px w-8 shrink-0 bg-[#ff806a]" />Code-review practice for developer training programs</p>
          <h1 className="mt-7 max-w-[650px] text-[44px] font-semibold leading-[1.06] tracking-[-2.3px] sm:text-[59px] lg:text-[65px]">Your students can write code. <span className="font-serif font-normal italic text-[#ff806a]">Can they review it?</span></h1>
          <p className="mt-7 max-w-[560px] text-[15px] leading-7 text-[#b8c1c6]">Give future developers hands-on practice with realistic pull requests. Students identify issues, explain their reasoning, and get feedback on what they caught, what they missed, and why it matters.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <PilotLink placement="hero" className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#211916] transition hover:bg-[#ff9a87]">Request a cohort pilot <span aria-hidden="true" className="ml-2">↗</span></PilotLink>
            <a href="#graded-review-demo" className="rounded-md border border-[#ffffff32] px-5 py-3 text-[13px] font-semibold text-[#e1e5e7] transition hover:border-[#ff806a]">See a sample review <span aria-hidden="true" className="ml-2 text-[#ff9a87]">↓</span></a>
          </div>
          <p className="mt-5 text-[12px] text-[#9da8af]">Start with a small group of students. No LMS integration required.</p>
        </div>
        <div aria-label="Example ReviewIQ pull request and feedback" className="relative min-w-0 rounded-xl border border-[#ffffff20] bg-[#151b20] shadow-[0_35px_100px_-40px_#000]">
          <div className="flex items-center justify-between gap-3 border-b border-[#ffffff14] px-5 py-3"><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#a9b4ba]">Student practice · sample</span><span className="rounded-full bg-[#ff806a19] px-2.5 py-1 text-[10px] text-[#ffab98]">Python · Backend</span></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="min-w-0 border-b border-[#ffffff14] p-5 md:border-b-0 md:border-r lg:border-b lg:border-r-0 xl:border-b-0 xl:border-r"><p className="text-[10px] text-[#9aa6ad]">Pull request · account service</p><p className="mt-1 text-[14px] font-semibold">Update account handling</p><pre tabIndex={0} aria-label="Example code change" className="mt-5 overflow-auto rounded-md border border-[#ffffff12] bg-[#0d1216] p-3 font-mono text-[10px] leading-6 text-[#cdd5d8]"><code>{"def find_account(email, accounts):\n-  accounts.get(email.lower())\n+  accounts.get(email)\n\ndef deactivate(account, db):\n+  account.active = False\n+  db.save(account)\n+  return True"}</code></pre><p className="mt-3 text-[11px] text-[#92a0a7]">Two planted issues in this example</p></div>
            <div className="min-w-0 p-5"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#9aa6ad]">Review → feedback</p><blockquote className="mt-4 border-l-2 border-[#ff806a] pl-3 text-[11px] leading-5 text-[#d4dade]">“The lookup no longer normalizes email casing. Different casing could miss an account.”</blockquote><div className="mt-5 space-y-2"><p className="rounded-md border border-emerald-300/20 bg-emerald-300/[.05] px-3 py-2 text-[11px] text-[#b8d9c3]"><b>Caught</b> · email normalization</p><p className="rounded-md border border-[#ff806a33] bg-[#ff806a0a] px-3 py-2 text-[11px] text-[#e4b7ac]"><b>Missed</b> · save failure reported as success</p></div></div>
          </div>
          <p className="border-t border-[#ffffff14] px-5 py-3 text-[10px] text-[#88969d]">Illustrative sample · actual results vary</p>
        </div>
      </section>

      <section id="for-students" className="border-y border-[#ffffff12] bg-[#13191e] px-6 py-20 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Beyond writing code</p><h2 className="mt-4 max-w-lg text-[32px] font-semibold leading-tight tracking-[-1px] sm:text-[41px]">Building software is only part of working on a team.</h2></div><p className="max-w-2xl text-[15px] leading-8 text-[#b6c0c5] lg:pt-8">Students spend time learning how to implement features and fix bugs. Professional development also means reading unfamiliar code, spotting problems, and communicating useful feedback. ReviewIQ adds focused practice alongside the curriculum you already teach.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{capabilities.map(([number, title, body]) => <article key={number} className="rounded-lg border border-[#ffffff14] bg-[#171e23] p-6"><p className="font-mono text-[11px] text-[#ff9a87]">{number}</p><h3 className="mt-6 text-[17px] font-semibold">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#aab5bb]">{body}</p></article>)}</div></div></section>

      <GradedReviewDemo audience="bootcamps" />

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-10 px-6 py-20 lg:px-10 lg:py-24"><div className="max-w-3xl"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">How it fits</p><h2 className="mt-4 text-[32px] font-semibold tracking-[-1.1px] sm:text-[41px]">A practical addition to your existing curriculum.</h2><p className="mt-4 text-[14px] leading-7 text-[#aeb9bf]">Introduce the practice without rebuilding your courses. Students use their own accounts and revisit their own results.</p></div><div className="mt-12 grid gap-7 border-t border-[#ffffff1a] pt-8 md:grid-cols-3">{steps.map(([number, title, body]) => <article key={number}><p className="font-mono text-[12px] text-[#ff927e]">{number} <span aria-hidden="true" className="ml-3 text-[#566169]">↗</span></p><h3 className="mt-5 text-[17px] font-semibold">{title}</h3><p className="mt-3 text-[13px] leading-7 text-[#aab5bb]">{body}</p></article>)}</div></section>

      <section className="border-y border-[#ffffff12] bg-[#13191e] px-6 py-20 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">In your program</p><h2 className="mt-4 text-[32px] font-semibold tracking-[-1.1px] sm:text-[41px]">Give code-review practice a place in your program.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{useCases.map(([title, body]) => <article key={title} className="rounded-lg border border-[#ffffff14] bg-[#171e23] p-6"><h3 className="text-[17px] font-semibold">{title}</h3><p className="mt-3 text-[13px] leading-7 text-[#aab5bb]">{body}</p></article>)}</div></div></section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1fr] lg:px-10 lg:py-24"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Founder-supported pilot</p><h2 className="mt-4 max-w-xl text-[33px] font-semibold leading-tight tracking-[-1.1px] sm:text-[42px]">Start small. See how your students respond.</h2><p className="mt-5 max-w-xl text-[14px] leading-7 text-[#b4bec4]">A practical evaluation with a small group, supported directly by the ReviewIQ founder. No integration, instructor dashboard, or curriculum overhaul required for the initial pilot.</p><div className="mt-8 flex flex-wrap items-center gap-5"><PilotLink placement="pilot_offer" className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#211916] transition hover:bg-[#ff9a87]">Request a pilot <span className="ml-2" aria-hidden="true">↗</span></PilotLink><Link href="/login?mode=signup" className="text-[12px] text-[#d5dde1] underline decoration-[#64717a] underline-offset-4 hover:text-white">Try an individual review first</Link></div><p className="mt-5 text-[11px] leading-6 text-[#94a1a8]">Each new account starts with {FREE_REVIEW_CREDITS} free review credits. Pilot access, duration, and commercial terms are agreed individually.</p></div><div className="rounded-xl border border-[#ffffff1a] bg-[#171e23] p-6 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#ff9a87]">How the pilot works</p><ol className="mt-6 space-y-6">{pilotSteps.map(([number, title, body]) => <li key={number} className="flex gap-4 border-t border-[#ffffff14] pt-5 first:border-t-0 first:pt-0"><span className="font-mono text-[11px] text-[#ff9a87]">{number}</span><div><h3 className="text-[15px] font-semibold text-[#f4f5f6]">{title}</h3><p className="mt-2 text-[12px] leading-6 text-[#abb6bc]">{body}</p></div></li>)}</ol></div></section>

      <section className="border-y border-[#ffffff12] bg-[#13191e] px-6 py-20 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Questions</p><h2 className="mt-4 text-[32px] font-semibold tracking-[-1px] sm:text-[40px]">The practical details.</h2><div className="mt-9 grid gap-x-12 gap-y-8 md:grid-cols-2"><article><h3 className="text-[15px] font-semibold">Do students need to install anything?</h3><p className="mt-2 text-[13px] leading-7 text-[#aab5bb]">No. ReviewIQ runs in the browser.</p></article><article><h3 className="text-[15px] font-semibold">Which languages are available?</h3><p className="mt-2 text-[13px] leading-7 text-[#aab5bb]">{new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format([...LANGUAGES])}.</p></article><article><h3 className="text-[15px] font-semibold">Does this replace our existing curriculum?</h3><p className="mt-2 text-[13px] leading-7 text-[#aab5bb]">No. It provides additional code-review practice alongside existing courses and projects.</p></article><article><h3 className="text-[15px] font-semibold">Can instructors track students&apos; progress?</h3><p className="mt-2 text-[13px] leading-7 text-[#aab5bb]">ReviewIQ currently provides individual student histories rather than a centralized instructor dashboard. For initial pilots, we&apos;ll coordinate directly with your team to discuss participation and feedback.</p></article></div></div></section>

      <section id="pilot-form" className="mx-auto grid max-w-7xl scroll-mt-8 gap-12 px-6 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-28"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Start with a conversation</p><h2 className="mt-4 max-w-xl text-[34px] font-semibold leading-tight tracking-[-1.2px] sm:text-[44px]">Ready to give your students more than another coding exercise?</h2><p className="mt-5 max-w-md text-[14px] leading-7 text-[#b4bec4]">Tell us about your program. We&apos;ll discuss a small pilot and whether ReviewIQ fits your students.</p></div><PilotForm /></section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ffffff12] px-6 py-7 text-[11px] text-[#89949b] lg:px-10"><Link href="/" className="font-extrabold tracking-[-.7px] text-[#d8dcde]">Review<span className="text-[#ff806a]">IQ</span></Link><span>Code-review practice for developer training programs.</span><span>© 2026 ReviewIQ</span></footer>
    </main>
  );
}
