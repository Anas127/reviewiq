"use client";

import { useEffect } from "react";
import { captureProductEventOncePerSession } from "@/lib/analytics";

export default function BootcampsAnalytics() {
  useEffect(() => {
    captureProductEventOncePerSession("bootcamps-page-viewed", "bootcamps_page_viewed");
  }, []);
  return null;
}
