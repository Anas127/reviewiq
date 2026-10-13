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

  return (
    <aside aria-label="Example exercise" className="w-full min-w-0 overflow-hidden rounded-xl border border-[#ffffff1a] bg-[#151b20] shadow-[0_34px_100px_-38px_#000]">
      <div className="flex items-center justify-between gap-3 border-b border-[#ffffff12] bg-[#171e23] px-4 py-3 sm:px-5">
        <h2 className="text-xs font-semibold uppercase tracking-[.15em] text-[#ff9a87]">Example exercise</h2>
        <span className="font-mono text-xs text-[#aab4ba]">Python</span>
      </div>
      <div className="min-w-0 p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#aab4ba]">Intended behavior</p>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-[#d8dee1]">Return True when the user&apos;s email is already registered.</p>
        <pre tabIndex={0} aria-label="Example code change" className="mt-4 max-w-full overflow-x-auto rounded-md border border-[#ffffff12] bg-[#0e1317] p-4 font-mono text-sm leading-relaxed text-[#c9d3d8]"><code>{code}</code></pre>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-semibold">What would you flag?</p>
          <button type="button" aria-expanded={revealed} aria-controls="example-issue" onClick={() => setRevealed((value) => !value)} className="min-h-12 rounded-md border border-[#ff806a66] px-4 py-2.5 text-sm font-semibold text-[#ffab98] hover:bg-[#ff806a12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87]">{revealed ? "Hide the issue" : "Show the issue"}</button>
        </div>
        <p id="example-issue" hidden={!revealed} className="mt-4 max-w-[65ch] rounded-md border border-[#ff806a33] bg-[#ff806a0a] p-4 text-sm leading-relaxed text-[#e0c5be]">The function returns False after the first nonmatching user. If a later user has the email, it incorrectly reports that the email is available. Move the False return outside the loop.</p>
      </div>
    </aside>
  );
}
