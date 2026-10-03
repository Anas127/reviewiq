"use client";

import posthog from "posthog-js";

type UpgradeButtonProps = {
  href: string;
};

export default function UpgradeButton({ href }: UpgradeButtonProps) {
  function handleClick() {
    posthog.capture("upgrade_clicked");
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-7 rounded-md bg-[#ff806a] py-3 text-center text-[12px] font-bold text-[#201715] transition hover:bg-[#ff9a87]"
    >
      Get ReviewIQ Pro <span className="ml-2">↗</span>
    </a>
  );
}