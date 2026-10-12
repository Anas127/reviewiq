"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { captureProductEvent, resetProductUser } from "@/lib/analytics";

export default function ProductHeader({ active }: { active: "review" | "history" }) {
  const [credits, setCredits] = useState<number | null>(null);
  useEffect(() => {
    const refresh = () => fetch("/api/credits").then((response) => response.json()).then((data) => setCredits(data.credits)).catch(() => setCredits(0));
    refresh();
    window.addEventListener("reviewiq:credits-updated", refresh);
    return () => window.removeEventListener("reviewiq:credits-updated", refresh);
  }, []);
  const gumroadUrl = process.env.NEXT_PUBLIC_GUMROAD_URL;
  async function signOut() {
    await createClient().auth.signOut();
    resetProductUser();
    window.location.href = "/";
  }
  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#273039] bg-[#0d1115] px-5 py-3 sm:px-7">
      <div className="flex items-center gap-4 sm:gap-7">
        <Link href="/review" className="text-[21px] font-extrabold tracking-[-1.1px] text-[#f4f5f6]">Review<span className="text-[#ff765f]">IQ</span></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link href="/review" aria-current={active === "review" ? "page" : undefined} className={`rounded px-3 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#ff9a86] ${active === "review" ? "bg-[#20262b] text-white" : "text-[#a4adb4] hover:bg-[#20262b] hover:text-white"}`}>Practice</Link>
          <Link href="/history" aria-current={active === "history" ? "page" : undefined} className={`rounded px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#ff9a86] ${active === "history" ? "bg-[#20262b] text-white" : "text-[#a4adb4] hover:bg-[#20262b] hover:text-white"}`}>History</Link>
        </nav>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span aria-live="polite" className="text-[10px] text-[#c0c8cd] sm:text-[12px]">{credits === null ? "Loading credits" : `${credits} practice credit${credits === 1 ? "" : "s"} left`}</span>
        {gumroadUrl ? <a href="/api/checkout" target="_blank" rel="noopener noreferrer" onClick={() => { captureProductEvent("upgrade_clicked"); captureProductEvent("checkout_started", { provider: "gumroad" }); }} className="rounded-md border border-[#48515a] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:border-[#ff765f] hover:text-[#ff9a86] focus-visible:outline-2 focus-visible:outline-[#ff9a86]">Upgrade to Pro</a> : <Link href="/pricing" onClick={() => captureProductEvent("upgrade_clicked")} className="rounded-md border border-[#48515a] px-3 py-2 text-[12px] font-semibold text-white hover:border-[#ff765f] focus-visible:outline-2 focus-visible:outline-[#ff9a86]">Upgrade to Pro</Link>}
        <button onClick={signOut} className="rounded px-2 py-2 text-[12px] font-medium text-[#aab4ba] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#ff9a86]">Sign out</button>
      </div>
    </header>
  );
}
