"use client";

import { useEffect, useRef } from "react";
import { captureProductEvent, rememberLandingCopyVersion } from "@/lib/analytics";

export default function LandingAnalytics() {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    rememberLandingCopyVersion();
    captureProductEvent("landing_viewed");
  }, []);

  return null;
}
