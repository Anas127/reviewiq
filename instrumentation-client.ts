import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: "identified_only",

  // We will explicitly track the product actions we care about.
  autocapture: false,

  // Don't record sessions/UI automatically.
  disable_session_recording: true,
});