"use client";

import { useState } from "react";

const code = `def email_exists(email, users):
    for user in users:
        if user.email == email:
            return True
        return False
    return False`;

export default function ExampleExercisePreview() {
  const [revealed, setRevealed] = useState(false);
  return <aside aria-label="Example exercise" className="w-full min-w-0 overflow-hidden rounded-xl border border-[#ffffff1a] bg-[#151b20] shadow-[0_34px_100px_-38px_#000]">
    <div className="flex items-center justify-between border-b border-[#ffffff12] bg-[#171e23] px-5 py-3"><h2 className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#ff9a87]">Example exercise</h2><span className="font-mono text-[11px] text-[#89949d]">Python</span></div>
    <div className="p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#919da5]">Intended behavior</p>
      <p className="mt-2 text-[13px] leading-6 text-[#d8dee1]">Return True when the user&apos;s email is already registered.</p>
      <pre tabIndex={0} aria-label="Example code change" className="mt-4 overflow-x-auto rounded-md border border-[#ffffff12] bg-[#0e1317] p-4 font-mono text-[11px] leading-6 text-[#c9d3d8] sm:text-[12px]"><code>{code}</code></pre>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[14px] font-semibold">What would you flag?</p><button type="button" aria-expanded={revealed} aria-controls="example-issue" onClick={() => setRevealed((value) => !value)} className="rounded-md border border-[#ff806a66] px-3 py-2 text-[12px] font-semibold text-[#ffab98] hover:bg-[#ff806a12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">{revealed ? "Hide the issue" : "Show the issue"}</button></div>
      <p id="example-issue" hidden={!revealed} className="mt-4 rounded-md border border-[#ff806a33] bg-[#ff806a0a] p-4 text-[12px] leading-6 text-[#e0c5be]">The function returns False after the first nonmatching user. If a later user has the email, it incorrectly reports that the email is available. Move the False return outside the loop.</p>
    </div>
  </aside>;
}
