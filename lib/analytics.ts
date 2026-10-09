"use client";

import posthog from "posthog-js";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function acquisitionContext() {
  if (typeof window === "undefined") return {};
  const query = new URLSearchParams(window.location.search);
  const current = {
    referrer: document.referrer || undefined,
    utm_source: query.get("utm_source") || undefined,
    utm_campaign: query.get("utm_campaign") || undefined,
    utm_medium: query.get("utm_medium") || undefined,
  };
  try {
    const stored = window.sessionStorage.getItem("reviewiq:acquisition-context");
    if (stored) return { ...current, ...JSON.parse(stored) };
    window.sessionStorage.setItem("reviewiq:acquisition-context", JSON.stringify(current));
  } catch {
    // Continue without persisted acquisition context if browser storage is disabled.
  }
  return current;
}

export function captureProductEvent(event: string, properties: EventProperties = {}) {
  posthog.capture(event, { ...acquisitionContext(), ...properties });
}

export function captureProductEventOnce(key: string, event: string, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;
  const storageKey = `reviewiq:event:${key}`;
  try {
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // Analytics should never block the product flow when storage is unavailable.
  }
  captureProductEvent(event, properties);
}

export function captureProductEventOncePerSession(key: string, event: string, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;
  const storageKey = `reviewiq:session-event:${key}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Analytics should never block the product flow when storage is unavailable.
  }
  captureProductEvent(event, properties);
}
