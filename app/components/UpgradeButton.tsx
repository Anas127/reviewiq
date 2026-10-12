"use client";

import { captureProductEvent } from "@/lib/analytics";

export default function UpgradeButton() {
  function handleClick() {
    captureProductEvent("pro_plan_cta_clicked", { provider: "gumroad" });
    captureProductEvent("upgrade_clicked", { provider: "gumroad" });
    captureProductEvent("checkout_started", { provider: "gumroad" });
  }

  return (
    <a
      href="/api/checkout"
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-7 rounded-md bg-[#ff806a] py-3 text-center text-[12px] font-bold text-[#201715] transition hover:bg-[#ff9a87]"
    >
      Continue with Pro <span className="ml-2">↗</span>
    </a>
  );
}
