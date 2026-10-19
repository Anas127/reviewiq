"use client";

import { useEffect, useRef, useState } from "react";
import TrackedLink from "@/app/components/TrackedLink";
import { captureProductEventOncePerSession } from "@/lib/analytics";

export default function GradedReviewDemo({ audience = "consumer" }: { audience?: "consumer" | "bootcamps" }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const event = audience === "bootcamps" ? "bootcamps_demo_viewed" : "graded_review_demo_viewed";
        captureProductEventOncePerSession(event, event);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [audience]);
  useEffect(() => {
    if (audience !== "consumer") return;
    const reveal = () => setRevealed(true);
    const revealFromHash = () => {
      if (window.location.hash === "#graded-review-demo") reveal();
    };
    window.addEventListener("reviewiq:reveal-graded-demo", reveal);
    window.addEventListener("hashchange", revealFromHash);
    revealFromHash();
    return () => {
      window.removeEventListener("reviewiq:reveal-graded-demo", reveal);
      window.removeEventListener("hashchange", revealFromHash);
    };
  }, [audience]);

  return (
    <section id="graded-review-demo" ref={sectionRef} className="scroll-mt-8 border-y border-[#ffffff12] bg-[#13191e] px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#ff927e]">{audience === "bootcamps" ? "See the practice experience" : "Graded-review demo"}</p>
          <h2 className="landing-section-title mt-3 font-semibold tracking-[-1.2px]">{audience === "bootcamps" ? "A realistic pull request. A student’s judgment. Immediate feedback." : "How many bugs would you miss?"}</h2>
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-[#aab4ba]">{audience === "bootcamps" ? "A short pull request, a realistic review, and a clear comparison with the issues planted in the change." : "Read the code before revealing the sample review. Then compare your findings with the score and feedback."}</p>
        </div>
        <div className="mt-9 grid overflow-hidden rounded-xl border border-[#ffffff1a] bg-[#151b20] lg:grid-cols-[1.05fr_.95fr]">
          <div className="min-w-0 border-b border-[#ffffff12] p-4 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-[#89959d]">Pull request · account service</p><h3 className="mt-1 text-base font-semibold">Update account handling</h3></div><span className="rounded border border-[#ffffff20] px-2 py-1 text-xs text-[#c1c9ce]">Python · 2 issues planted</span></div>
            <pre tabIndex={0} aria-label="Example Python diff with two planted issues" className="mt-5 max-w-full overflow-x-auto rounded-md border border-[#ffffff10] bg-[#0e1317] p-4 font-mono text-sm leading-6 text-[#c8d0d4]"><code><span className="block">def find_account(email, accounts):</span><span className="block bg-[#d9664b14] text-[#d2a197]">-    account = accounts.get(email.strip().lower())</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    account = accounts.get(email)</span><span className="block">    if account is None: return None</span><span className="block">    return account</span><span className="mt-3 block">def deactivate(account, db):</span><span className="block bg-[#d9664b14] text-[#d2a197]">-    if not db.save(account): return False</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    account.active = False</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    db.save(account)</span><span className="block bg-[#72bd8b12] text-[#9fc4aa]">+    return True</span></code></pre>
            <p className="mt-3 text-sm leading-relaxed text-[#89959d]">Review the change and explain each risk, its impact, and a practical fix.</p>
            {audience === "consumer" && <button type="button" aria-expanded={revealed} aria-controls="graded-demo-result" onClick={() => setRevealed((value) => !value)} className="mt-5 inline-flex min-h-12 items-center rounded-md border border-[#ff806a66] px-4 py-2.5 text-sm font-semibold text-[#ffab98] hover:bg-[#ff806a12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">{revealed ? "Hide the sample review" : "Reveal the sample review"}</button>}
          </div>
          {!revealed && audience === "consumer" && <div className="flex items-center justify-center p-7 text-center text-base leading-relaxed text-[#aab4ba]">Read the code, then reveal the sample review and result.</div>}
          <div id="graded-demo-result" className={revealed || audience === "bootcamps" ? "grid gap-0 sm:grid-cols-2 lg:grid-cols-1" : "hidden"}>
            <div className="border-b border-[#ffffff12] p-4 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#9ba6ad]">Example review</p><blockquote className="mt-3 border-l-2 border-[#ff806a] pl-3 text-sm leading-relaxed text-[#d0d6da]">“The lookup no longer normalizes email casing. A stored address like Ana@example.com will not match ana@example.com; normalize the key before lookup.”</blockquote></div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#9ba6ad]">ReviewIQ result · example</p><p className="mt-2 text-3xl font-semibold leading-none text-[#f4f5f6]">6.0<span className="ml-1 text-sm font-medium text-[#9ba6ad]">/10</span></p></div><p className="text-sm font-medium text-[#d6ddda]">1 of 2 issues caught</p></div>
              <div className="mt-4 space-y-2.5">
                <div className="rounded-md border border-emerald-300/20 bg-emerald-300/[.05] p-3"><p className="text-sm font-semibold text-[#a9dfbc]">Caught · email normalization</p><p className="mt-1 text-sm leading-relaxed text-[#b8c2c6]">You identified that differently cased addresses can miss the stored account.</p></div>
                <div className="rounded-md border border-[#ff806a33] bg-[#ff806a0a] p-3"><p className="text-sm font-semibold text-[#ffab98]">Missed · save failure reported as success</p><p className="mt-1 text-sm leading-relaxed text-[#b8c2c6]">The new code ignores the save result, then returns True. Check persistence before telling the caller deactivation succeeded.</p></div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#aab4ba]">Feedback: You explained the impact clearly. Next, trace the failure path after each state change.</p>
              <p className="mt-2 text-xs leading-relaxed text-[#aab4ba]">Illustrative example. Actual scores and feedback vary by review.</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4"><TrackedLink href={audience === "bootcamps" ? "#pilot-form" : "/login?mode=signup&redirect=%2Freview"} event={audience === "bootcamps" ? "bootcamps_pilot_cta_clicked" : "graded_review_demo_cta_clicked"} eventProperties={audience === "bootcamps" ? { placement: "demo" } : undefined} className="inline-flex min-h-11 items-center rounded-md bg-[#ff806a] px-5 py-3 text-sm font-bold text-[#1d1715] transition hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">{audience === "bootcamps" ? "Bring this practice to your cohort" : "Start my first review free"} <span className="ml-2" aria-hidden="true">↗</span></TrackedLink><span className="text-xs text-[#9aa5ac]">{audience === "bootcamps" ? "Illustrative review · actual results vary" : "No card required"}</span></div>
      </div>
    </section>
  );
}
