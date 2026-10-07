"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { captureProductEvent } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  event: string;
  eventProperties?: Record<string, string | number | boolean>;
};

export default function TrackedLink({ event, eventProperties, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) captureProductEvent(event, eventProperties);
      }}
    />
  );
}
