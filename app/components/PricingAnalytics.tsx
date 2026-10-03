"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export default function PricingAnalytics() {
  useEffect(() => {
    posthog.capture("pricing_opened");
  }, []);

  return null;
}