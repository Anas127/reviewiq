"use client";

import { captureProductEvent } from "@/lib/analytics";
import { PRO_CREDITS_PER_BILLING_CYCLE } from "@/lib/credit-config";

type UpgradeButtonProps = {
  href: string;
};

export default function UpgradeButton({ href }: UpgradeButtonProps) {
  function handleClick() {
    captureProductEvent("pro_plan_cta_clicked", { provider: "gumroad" });
    captureProductEvent("upgrade_clicked", { provider: "gumroad" });
    captureProductEvent("checkout_started", { provider: "gumroad" });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-7 rounded-md bg-[#ff806a] py-3 text-center text-[12px] font-bold text-[#201715] transition hover:bg-[#ff9a87]"
    >
      Unlock {PRO_CREDITS_PER_BILLING_CYCLE} reviews <span className="ml-2">↗</span>
    </a>
  );
}
