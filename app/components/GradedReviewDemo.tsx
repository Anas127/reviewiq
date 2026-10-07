"use client";

import { useEffect, useRef } from "react";
import TrackedLink from "@/app/components/TrackedLink";
import { captureProductEventOncePerSession } from "@/lib/analytics";
import { FREE_REVIEW_CREDITS } from "@/lib/credit-config";

export default function GradedReviewDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        captureProductEventOncePerSession("graded-review-demo-viewed", "graded_review_demo_viewed");
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="graded-review-demo" ref={sectionRef} className="scroll-mt-8 border-y border-[#ffffff12] bg-[#13191e] px-6 py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#ff927e]">A review, then the reveal</p>
          <h2 className="mt-3 text-[32px] font-semibold tracking-[-1.2px] sm:text-[40px]">Would you have caught this?</h2>
          <p className="mt-4 text-[14px] leading-7 text-[#aab4ba]">A short pull request, a realistic review, and a clear comparison with the issues planted in the change.</p>
        </div>
        <div className="mt-9 grid overflow-hidden rounded-xl border border-[#ffffff1a] bg-[#151b20] lg:grid-cols-[1.05fr_.95fr]">
          <div className="border-b border-[#ffffff12] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] text-[#89959d]">Pull request · account service</p><h3 className="mt-1 text-[15px] font-semibold">Update account handling</h3></div><span className="rounded border border-[#ffffff20] px-2 py-1 text-[10px] text-[#c1c9ce]">Python · 2 issues planted</span></div>
            <pre tabIndex={0} aria-label="Example Python diff with two planted issues" className="mt-5 max-h-64 overflow-auto rounded-md border border-[#ffffff10] bg-[#0e1317] p-4 font-mono text-[11px] leading-6 text-[#c8d0d4] sm:text-[12px]"><code><span className="block">def find_account(email, accounts):</span><span className="block bg-[#d9664b14] text-[#d2a197]">-    account = accounts.get(email.strip().lower())</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    account = accounts.get(email)</span><span className="block">    if account is None: return None</span><span className="block">    return account</span><span className="mt-3 block">def deactivate(account, db):</span><span className="block bg-[#d9664b14] text-[#d2a197]">-    if not db.save(account): return False</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    account.active = False</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    db.save(account)</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    return True</span></code></pre>
            <p className="mt-3 text-[11px] leading-5 text-[#89959d]">Review the change and explain each risk, its impact, and a practical fix.</p>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-1">
            <div className="border-b border-[#ffffff12] p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#9ba6ad]">Example review</p><blockquote className="mt-3 border-l-2 border-[#ff806a] pl-3 text-[12px] leading-6 text-[#d0d6da]">“The lookup no longer normalizes email casing. A stored address like Ana@example.com will not match ana@example.com; normalize the key before lookup.”</blockquote></div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#9ba6ad]">ReviewIQ result · example</p><p className="mt-2 text-[28px] font-semibold leading-none text-[#f4f5f6]">6.0<span className="ml-1 text-[14px] font-medium text-[#9ba6ad]">/10</span></p></div><p className="text-[12px] font-medium text-[#d6ddda]">1 of 2 issues caught</p></div>
              <div className="mt-4 space-y-2.5">
                <div className="rounded-md border border-emerald-300/20 bg-emerald-300/[.05] p-3"><p className="text-[11px] font-semibold text-[#a9dfbc]">Caught · email normalization</p><p className="mt-1 text-[11px] leading-5 text-[#b8c2c6]">You identified that differently cased addresses can miss the stored account.</p></div>
                <div className="rounded-md border border-[#ff806a33] bg-[#ff806a0a] p-3"><p className="text-[11px] font-semibold text-[#ffab98]">Missed · save failure reported as success</p><p className="mt-1 text-[11px] leading-5 text-[#b8c2c6]">The new code ignores the save result, then returns True. Check persistence before telling the caller deactivation succeeded.</p></div>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#aab4ba]">Feedback: You explained the impact clearly. Next, trace the failure path after each state change.</p>
              <p className="mt-2 text-[9px] text-[#77838a]">Illustrative example. Actual scores and feedback vary by review.</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4"><TrackedLink href="/login?mode=signup" event="graded_review_demo_cta_clicked" className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#1d1715] transition hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">Test my review skills — {FREE_REVIEW_CREDITS} free <span className="ml-2" aria-hidden="true">↗</span></TrackedLink><span className="text-[12px] text-[#9aa5ac]">No card required</span></div>
      </div>
    </section>
  );
}
