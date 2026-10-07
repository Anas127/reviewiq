"use client";

import { useEffect, useRef } from "react";
import { captureProductEvent } from "@/lib/analytics";

export default function PricingAnalytics() {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    captureProductEvent("pricing_viewed");
  }, []);

  return null;
}
