"use client";

import { useRef, useState, type FormEvent } from "react";
import { acquisitionContext, captureProductEvent, captureProductEventOncePerSession } from "@/lib/analytics";

const inputClass = "mt-2 w-full rounded-md border border-[#ffffff25] bg-[#101418] px-4 py-3 text-[14px] text-white placeholder:text-[#77838a] focus:border-[#ff806a] focus:outline-none";

export default function PilotForm() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  const submissionId = useRef<string | null>(null);

  function markStarted() {
    captureProductEventOncePerSession("bootcamps-pilot-form-started", "bootcamps_pilot_form_started");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");

    const form = event.currentTarget;
    const values = new FormData(form);
    submissionId.current ??= crypto.randomUUID();
    const context = acquisitionContext();

    try {
      const response = await fetch("/api/bootcamps/pilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId.current,
          name: values.get("name"),
          email: values.get("email"),
          organization: values.get("organization"),
          cohortSize: values.get("cohortSize"),
          message: values.get("message"),
          website: values.get("website"),
          utmSource: context.utm_source,
          utmMedium: context.utm_medium,
          utmCampaign: context.utm_campaign,
        }),
      });
      const result = await response.json() as { received?: boolean; error?: string };
      if (!response.ok || !result.received) throw new Error(result.error || "We could not receive your request. Please try again.");
      setSubmitted(true);
      captureProductEvent("bootcamps_pilot_submitted", { source: "bootcamps_page" });
    } catch (caught) {
      const message = caught instanceof Error && /^(Please|We could)/.test(caught.message)
        ? caught.message
        : "We could not receive your request. Please try again.";
      setError(message);
      captureProductEvent("bootcamps_pilot_submission_failed", { source: "bootcamps_page" });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  if (submitted) {
    return <div role="status" className="rounded-xl border border-[#a9dfbc66] bg-[#a9dfbc0d] p-6 text-[15px] leading-7 text-[#d9ece0]">Thanks — your request has been received. We&apos;ll use your email to follow up about a pilot.</div>;
  }

  return (
    <form onSubmit={handleSubmit} onFocusCapture={markStarted} className="rounded-xl border border-[#ffffff22] bg-[#181f24] p-5 shadow-[0_32px_90px_-45px_#000] sm:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#ff9a87]">Pilot inquiry</p>
      <h3 className="mt-2 text-[22px] font-semibold tracking-[-.5px]">Tell us about your program.</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-[12px] font-medium text-[#d5dbde]">Your name <span aria-hidden="true" className="text-[#ff9a87]">*</span><input className={inputClass} name="name" autoComplete="name" maxLength={120} required onChange={markStarted} /></label>
        <label className="block text-[12px] font-medium text-[#d5dbde]">Work email <span aria-hidden="true" className="text-[#ff9a87]">*</span><input className={inputClass} name="email" type="email" autoComplete="email" maxLength={254} required onChange={markStarted} /></label>
        <label className="block text-[12px] font-medium text-[#d5dbde]">Organization / program name <span aria-hidden="true" className="text-[#ff9a87]">*</span><input className={inputClass} name="organization" autoComplete="organization" maxLength={160} required onChange={markStarted} /></label>
        <label className="block text-[12px] font-medium text-[#d5dbde]">Approximate cohort size <span className="text-[#8f9aa1]">(optional)</span><input className={inputClass} name="cohortSize" maxLength={60} placeholder="e.g. 25 students" onChange={markStarted} /></label>
      </div>
      <label className="mt-5 block text-[12px] font-medium text-[#d5dbde]">Anything we should know? <span className="text-[#8f9aa1]">(optional)</span><textarea className={`${inputClass} min-h-28 resize-y`} name="message" maxLength={2000} placeholder="Your students, goals, or timing" onChange={markStarted} /></label>
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="mt-4 rounded-md border border-[#ff806a55] bg-[#ff806a10] px-3 py-2 text-[12px] text-[#ffd0c6]">{error}</p>}
      <button type="submit" disabled={pending} className="mt-6 w-full rounded-md bg-[#ff806a] px-5 py-3.5 text-[13px] font-bold text-[#211916] transition hover:bg-[#ff9a87] disabled:cursor-wait disabled:opacity-70 sm:w-auto">{pending ? "Sending request…" : "Request a cohort pilot"} <span aria-hidden="true" className="ml-2">↗</span></button>
      <p className="mt-4 max-w-md text-[11px] leading-5 text-[#9da8af]">We&apos;ll use your contact information only to respond to your pilot inquiry.</p>
    </form>
  );
}
