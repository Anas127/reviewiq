"use client";

import posthog from "posthog-js";

type EventProperties = Record<string, string | number | boolean | null | undefined>;
export const LANDING_COPY_VERSION = "ai_review_v1";
const copyVersionKey = "reviewiq:landing-copy-version";
const signupIntentKey = "reviewiq:signup-intent";

export function rememberLandingCopyVersion() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(copyVersionKey, LANDING_COPY_VERSION); } catch {}
}

function landingCopyVersion() {
  try { return window.localStorage.getItem(copyVersionKey) || undefined; } catch { return undefined; }
}

function referrerOrigin(value: string | undefined) {
  if (!value) return undefined;
  try { return new URL(value).origin; } catch { return undefined; }
}

export function acquisitionContext() {
  if (typeof window === "undefined") return {};
  const query = new URLSearchParams(window.location.search);
  const current = {
    referrer: referrerOrigin(document.referrer),
    utm_source: query.get("utm_source") || undefined,
    utm_campaign: query.get("utm_campaign") || undefined,
    utm_medium: query.get("utm_medium") || undefined,
  };
  try {
    const stored = window.sessionStorage.getItem("reviewiq:acquisition-context");
    if (stored) {
      const saved = JSON.parse(stored);
      return {
        referrer: referrerOrigin(saved.referrer) || current.referrer,
        utm_source: saved.utm_source || current.utm_source,
        utm_campaign: saved.utm_campaign || current.utm_campaign,
        utm_medium: saved.utm_medium || current.utm_medium,
        landing_copy_version: landingCopyVersion(),
      };
    }
    window.sessionStorage.setItem("reviewiq:acquisition-context", JSON.stringify(current));
  } catch {
    // Continue without persisted acquisition context if browser storage is disabled.
  }
  return { ...current, landing_copy_version: landingCopyVersion() };
}

export function captureProductEvent(event: string, properties: EventProperties = {}) {
  try { posthog.capture(event, { ...acquisitionContext(), ...properties }); } catch {}
}

export function markSignupIntent() {
  if (typeof window === "undefined") return;
  try {
    const previous = Number(window.localStorage.getItem(signupIntentKey));
    if (!previous || Date.now() - previous > 7 * 24 * 60 * 60 * 1000) {
      window.localStorage.setItem(signupIntentKey, String(Date.now()));
    }
  } catch {}
}

export function clearSignupIntent() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(signupIntentKey); } catch {}
}

export function identifyProductUser(userId: string, createdAt?: string, confirmedAt?: string, suppressSignup = false) {
  try { posthog.identify(userId); } catch {}
  if (!createdAt || typeof window === "undefined") return;
  try {
    const intent = Number(window.localStorage.getItem(signupIntentKey));
    const created = Date.parse(createdAt);
    if (!suppressSignup && confirmedAt && intent && Number.isFinite(created) && created >= intent - 120000 && created <= Date.now()) {
      captureProductEventOnce(`signup-completed-${userId}`, "signup_completed");
    }
    if (intent && confirmedAt) window.localStorage.removeItem(signupIntentKey);
  } catch {}
}

export function resetProductUser() {
  try { posthog.reset(); } catch {}
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
