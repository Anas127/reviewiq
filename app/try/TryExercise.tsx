"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { acquisitionContext } from "@/lib/analytics";

type Finding = { bug: number; reason: string; description?: string };
type Grading = { score: number; caught: Finding[]; missed: Finding[]; feedback: string; reviewQuality?: number; falsePositives?: string[] };
type PublicExercise = { role: string; language: string; seniority: string; description: string; task: string; code: string };

async function milestone(event: string) {
  await fetch("/api/guest/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }) }).catch(() => undefined);
}

export default function TryExercise({ exercise, placement }: { exercise: PublicExercise; placement: string }) {
  const [review, setReview] = useState("");
  const [attemptId, setAttemptId] = useState("");
  const [grading, setGrading] = useState<Grading | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const reviewRef = useRef("");

  const loadSession = useCallback(async () => {
    setLoadingSession(true); setError("");
    try {
      const acquisition = acquisitionContext();
      const response = await fetch("/api/guest/session", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...acquisition, cta_placement: placement, anonymous_id: posthog.get_distinct_id() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code === "session_rate_limit" ? "Too many guest sessions from this network today. Please try again tomorrow." : "Could not start your guest session. Please retry.");
      setAttemptId(data.attemptId);
      if (data.status === "graded" && data.grading) setGrading(data.grading);
      void milestone("guest_exercise_viewed");
      if (reviewRef.current.trim().length >= 10 && !started.current) {
        started.current = true;
        void milestone("guest_exercise_started");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start your guest session. Please retry."); }
    finally { setLoadingSession(false); }
  }, [placement]);

  useEffect(() => { const timer = window.setTimeout(() => void loadSession(), 0); return () => window.clearTimeout(timer); }, [loadSession]);
  useEffect(() => { if (grading && attemptId) void milestone("guest_result_viewed"); }, [grading, attemptId]);

  function editReview(value: string) {
    setReview(value);
    reviewRef.current = value;
    if (attemptId && !started.current && value.trim().length >= 10) {
      started.current = true;
      void milestone("guest_exercise_started");
    }
  }

  async function submit() {
    if (submitting || grading) return;
    if (review.trim().length < 40 || review.length > 6000) {
      setError("Write at least 40 and at most 6,000 characters before submitting."); return;
    }
    setSubmitting(true); setError("");
    try {
      void milestone("guest_exercise_started");
      const response = await fetch("/api/guest/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Grading failed. Please retry.");
      setGrading(data.grading);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Grading failed. Please retry."); }
    finally { setSubmitting(false); }
  }

  async function beginClaim(mode: "signup" | "signin") {
    if (authBusy) return;
    setAuthBusy(true); setError("");
    try {
      void milestone("guest_result_viewed");
      const response = await fetch("/api/guest/claim-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const data = await response.json();
      if (!response.ok) throw new Error("Could not prepare your result for saving. Please retry.");
      window.location.assign(data.redirect);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not prepare your result for saving."); setAuthBusy(false); }
  }

  return <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
    <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#ff9a87]">Free code review exercise</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Would you approve this change?</h1>
      <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-[#b2bbc1]">Complete this exercise free. Create an account afterward if you want to save your result and keep practicing.</p>
      <div className="mt-5 flex flex-wrap gap-2 text-sm"><span className="rounded border border-[#ffffff24] px-3 py-1">{exercise.role}</span><span className="rounded border border-[#ffffff24] px-3 py-1">{exercise.language}</span><span className="rounded border border-[#ffffff24] px-3 py-1">{exercise.seniority}</span></div>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="min-w-0 rounded-xl border border-[#ffffff1d] bg-[#151b20] p-4 sm:p-6">
        <h2 className="text-xl font-semibold">The change</h2><p className="mt-3 max-w-[68ch] text-base leading-relaxed text-[#c4cdd1]">{exercise.description}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#b2bbc1]">{exercise.task}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.15em] text-[#ff9a87]">Added · orders.py</p>
        <pre tabIndex={0} className="mt-2 max-w-full overflow-x-auto rounded-md border border-[#ffffff17] bg-[#0d1216] p-4 font-mono text-sm leading-6 text-[#d4dadd]" aria-label="Python code diff"><code>{exercise.code.split("\n").map((line, index) => <span className="block min-w-max" key={index}><span className="select-none pr-3 text-[#a9dfbc]">+</span>{line || " "}</span>)}</code></pre>
      </section>
      <section className="min-w-0 rounded-xl border border-[#ffffff1d] bg-[#151b20] p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Your review</h2>
        {!grading ? <><p className="mt-3 text-sm leading-relaxed text-[#b2bbc1]">Explain each issue you find, why it matters, and how you would fix it. Write in your own words.</p>
          <label htmlFor="guest-review" className="mt-5 block text-sm font-medium">Review notes</label>
          <textarea id="guest-review" value={review} onChange={(event) => editReview(event.target.value)} maxLength={6000} rows={13} placeholder="I would flag…" className="mt-2 w-full resize-y rounded-md border border-[#ffffff2b] bg-[#101519] p-4 text-base leading-relaxed text-white outline-none placeholder:text-[#87939b] focus:border-[#ff806a] focus-visible:ring-2 focus-visible:ring-[#ff806a]/40" />
          <p className="mt-1 text-xs text-[#aab4ba]">{review.length}/6000 characters</p>
          <button type="button" onClick={submit} disabled={loadingSession || submitting || !attemptId} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#ff806a] px-5 py-3 text-sm font-bold text-[#1d1715] hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87] disabled:cursor-wait disabled:opacity-60">{submitting ? "Grading your review…" : "Submit my review"}</button>
          {loadingSession && <p role="status" className="mt-3 text-sm text-[#b2bbc1]">Preparing your guest session…</p>}
          {!loadingSession && !attemptId && <button type="button" onClick={() => void loadSession()} className="mt-3 text-sm text-[#ff9a87] underline">Retry guest session</button>}
        </> : <div aria-live="polite" className="mt-5"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#ff9a87]">Your result</p><p className="mt-2 text-4xl font-semibold text-[#a9dfbc]">{grading.score}<span className="text-lg text-[#c0c9cd]"> / 10</span></p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm"><div className="rounded-md border border-[#a9dfbc44] p-3">Caught <strong className="block text-xl">{grading.caught.length}</strong></div><div className="rounded-md border border-[#ff806a44] p-3">Missed <strong className="block text-xl">{grading.missed.length}</strong></div></div>
          <div className="mt-5 space-y-3">{grading.caught.map((item) => <div key={`caught-${item.bug}`} className="rounded-md border border-[#a9dfbc33] p-3"><h3 className="font-semibold text-[#a9dfbc]">Caught · issue {item.bug}</h3><p className="mt-1 text-sm leading-relaxed text-[#c4cdd1]">{item.reason}</p></div>)}{grading.missed.map((item) => <div key={`missed-${item.bug}`} className="rounded-md border border-[#ff806a44] p-3"><h3 className="font-semibold text-[#ffab98]">Missed · issue {item.bug}</h3><p className="mt-1 text-sm leading-relaxed text-[#c4cdd1]">{item.description}</p><p className="mt-1 text-sm leading-relaxed text-[#aeb8be]">{item.reason}</p></div>)}</div>
          <h3 className="mt-6 font-semibold">Feedback</h3><p className="mt-2 text-sm leading-relaxed text-[#c4cdd1]">{grading.feedback}</p>
          <div className="mt-7 border-t border-[#ffffff1d] pt-6"><h3 className="text-lg font-semibold">Save your result and start your next review free</h3><p className="mt-2 text-sm leading-relaxed text-[#b2bbc1]">Create an account to keep this result in History. Your next review uses your free account credits.</p><button type="button" onClick={() => void beginClaim("signup")} disabled={authBusy} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#ff806a] px-5 py-3 text-sm font-bold text-[#1d1715] hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87] disabled:opacity-60">{authBusy ? "Preparing…" : "Save my result"}</button><button type="button" onClick={() => void beginClaim("signin")} disabled={authBusy} className="mt-3 min-h-11 w-full text-sm font-semibold text-[#ffab98] underline focus-visible:outline-2 focus-visible:outline-[#ff9a87]">Already have an account? Sign in</button></div>
        </div>}
        {error && <p role="alert" className="mt-4 rounded-md border border-[#ff806a55] bg-[#ff806a12] p-3 text-sm leading-relaxed text-[#ffab98]">{error}</p>}
      </section>
    </div>
  </div>;
}
