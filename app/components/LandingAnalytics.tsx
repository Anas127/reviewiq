"use client";

import { useEffect, useRef } from "react";
import { captureProductEvent } from "@/lib/analytics";

export default function LandingAnalytics() {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    captureProductEvent("landing_viewed");
  }, []);

  return null;
}
