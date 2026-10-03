"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export default function LandingAnalytics() {
  useEffect(() => {
    posthog.capture("landing_viewed");
  }, []);

  return null;
}