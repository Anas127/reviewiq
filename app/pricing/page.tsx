import Link from "next/link";
import PricingAnalytics from "@/app/components/PricingAnalytics";
import UpgradeButton from "@/app/components/UpgradeButton";
import TrackedLink from "@/app/components/TrackedLink";
import { FREE_REVIEW_CREDITS, PRO_CREDITS_PER_BILLING_CYCLE, PRO_PRICE_USD } from "@/lib/credit-config";

const gumroadUrl = process.env.NEXT_PUBLIC_GUMROAD_URL;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#101418] text-[#f4f5f6]">
      <PricingAnalytics />
      <nav aria-label="Main navigation" className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px]">Review<span className="text-[#ff806a]">IQ</span></Link>
        <div className="flex items-center gap-5 text-[13px] font-medium text-[#aab2b8] sm:gap-7"><Link href="/" className="hover:text-white">Product</Link><Link href="/pricing" aria-current="page" className="text-white">Pricing</Link></div>
        <TrackedLink href="/login?mode=signup&redirect=%2Freview" event="free_plan_cta_clicked" className="rounded-md bg-[#ff806a] px-3 py-2.5 text-[11px] font-bold text-[#1d1715] transition hover:bg-[#ff9a87] sm:px-4 sm:text-[12px]">Test my skills <span aria-hidden="true">↗</span></TrackedLink>
      </nav>
      <section className="px-6 pb-24 pt-14 lg:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[.24em] text-[#ff927e]">Pricing that leaves room to practice</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-center text-[39px] font-semibold leading-tight tracking-[-1.8px] sm:text-[54px]">Build the review judgment <span className="font-serif italic font-normal text-[#ff806a]">real teams expect.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[14px] leading-7 text-[#b2bbc1]">Start with {FREE_REVIEW_CREDITS} free reviews. Practice on realistic pull requests with deliberately planted issues, see what you catch and miss, and improve through repetition.</p>
          <div className="mx-auto mt-12 grid max-w-[860px] gap-5 md:grid-cols-2">
            <article className="flex flex-col rounded-xl border border-[#ffffff20] bg-[#151b20] p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#aab4ba]">Free · discover where you stand</p>
              <div className="mt-5 flex items-baseline gap-2"><span className="text-[44px] font-semibold tracking-[-2px]">$0</span><span className="text-[12px] text-[#aab4ba]">to start</span></div>
              <p className="mt-2 min-h-12 text-[13px] leading-6 text-[#b2bbc1]">See how your code-review judgment measures up.</p>
              <TrackedLink href="/login?mode=signup&redirect=%2Freview" event="free_plan_cta_clicked" className="mt-6 rounded-md border border-[#ffffff35] py-3 text-center text-[13px] font-semibold transition hover:border-[#ff806a] hover:text-white focus-visible:outline-2 focus-visible:outline-[#ff9a87]">Test my review skills free</TrackedLink>
              <ul className="mt-7 space-y-3.5 border-t border-[#ffffff18] pt-6 text-[13px] leading-5 text-[#d0d6da]">
                {[`${FREE_REVIEW_CREDITS} review credits to start`, "Realistic pull requests and planted issues", "Detailed caught-versus-missed feedback", "No card required", "Credits used only after successful grading and save"].map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-[#ff927e]">✓</span><span>{item}</span></li>)}
              </ul>
            </article>
            <article className="relative flex flex-col rounded-xl border border-[#ff806a66] bg-[#191e22] p-6 shadow-[0_24px_80px_-44px_#ff806a80] sm:p-8">
              <div className="absolute -top-3 right-6 rounded bg-[#ff806a] px-3 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-[#201715]">{PRO_CREDITS_PER_BILLING_CYCLE} reviews / cycle</div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">ReviewIQ Pro · deliberate repetition</p>
              <div className="mt-5 flex items-baseline gap-2"><span className="text-[44px] font-semibold tracking-[-2px]">{PRO_PRICE_USD}</span><span className="text-[12px] text-[#aab4ba]">/ month</span></div>
              <p className="mt-2 min-h-12 text-[13px] leading-6 text-[#c0c8cd]">Keep practicing with {PRO_CREDITS_PER_BILLING_CYCLE} more reviews each billing cycle for {PRO_PRICE_USD}/month.</p>
              {gumroadUrl ? <UpgradeButton /> : <TrackedLink href="/login" event="pro_plan_cta_clicked" className="mt-7 rounded-md bg-[#ff806a] py-3 text-center text-[13px] font-bold text-[#201715] transition hover:bg-[#ff9a87]">Continue with Pro <span className="ml-2">↗</span></TrackedLink>}
              <ul className="mt-7 space-y-3.5 border-t border-[#ffffff18] pt-6 text-[13px] leading-5 text-[#e0e4e6]">
                {[`${PRO_CREDITS_PER_BILLING_CYCLE} new review credits each billing cycle`, "Unused credits roll over", "Detailed feedback and full review history", "All supported roles, languages, and experience levels", "Cancel to stop future credit grants; keep existing credits"].map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-[#ff927e]">✓</span><span>{item}</span></li>)}
              </ul>
            </article>
          </div>
          <p className="mx-auto mt-7 max-w-2xl text-center text-[12px] leading-6 text-[#9ba6ad]">Gumroad securely handles payment. Use your ReviewIQ account email at checkout so the credits reach your account. ReviewIQ adds credits after a verified subscription payment; a credit is used only when your review is graded and saved successfully.</p>
        </div>
      </section>
      <footer className="border-t border-[#ffffff12] px-6 py-6 text-center text-[11px] text-[#89949b]">Review<span className="font-bold text-[#d8dcde]">IQ</span> · Deliberate practice for code-review judgment.</footer>
    </main>
  );
}
