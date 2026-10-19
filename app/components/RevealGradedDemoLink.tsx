"use client";

import type { ReactNode } from "react";
import TrackedLink from "@/app/components/TrackedLink";

export default function RevealGradedDemoLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <TrackedLink
      href="#graded-review-demo"
      event="hero_primary_clicked"
      eventProperties={{ location: "hero" }}
      className={className}
      onClick={() => window.dispatchEvent(new Event("reviewiq:reveal-graded-demo"))}
    >
      {children}
    </TrackedLink>
  );
}
