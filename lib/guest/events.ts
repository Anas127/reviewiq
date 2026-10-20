import "server-only";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { adminClient, type GuestAttempt } from "@/lib/guest/server";

export async function recordGuestEvent(attempt: GuestAttempt, eventName: string, suffix = "", extra: Record<string, string | number | boolean> = {}) {
  const eventKey = `${eventName}:${attempt.id}${suffix ? `:${suffix}` : ""}`;
  const properties = { ...attempt.attribution, ...extra, guest_attempt_id: attempt.id, exercise_id: attempt.exercise_id,
    flow_version: "guest_try_v1", $insert_id: eventKey };
  const admin = adminClient();
  const { error } = await admin.from("guest_event_outbox").upsert({ event_key: eventKey, event_name: eventName,
    attempt_id: attempt.id, user_id: extra.user_id || null, properties }, { onConflict: "event_key", ignoreDuplicates: true });
  if (error) throw error;
  after(() => flushGuestEvents(attempt.id));
}

export async function flushGuestEvents(attemptId: string) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return;
  const admin = adminClient();
  const { data, error } = await admin.from("guest_event_outbox").select("event_key,event_name,properties")
    .eq("attempt_id", attemptId).is("delivered_at", null).order("created_at", { ascending: true }).limit(20);
  if (error || !data?.length) return;
  const posthog = new PostHog(token, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    requestTimeout: 5000, fetchRetryCount: 1, fetchRetryDelay: 250 });
  try {
    for (const event of data) {
      const props = event.properties as Record<string, string>;
      posthog.capture({ distinctId: props.anonymous_id || `guest:${attemptId}`, event: event.event_name,
        properties: { ...props, $insert_id: event.event_key } });
    }
    await posthog.flush();
    await admin.from("guest_event_outbox").update({ delivered_at: new Date().toISOString() })
      .in("event_key", data.map((event) => event.event_key));
  } catch (error) {
    console.error("Guest analytics delivery failed", error);
  } finally {
    await posthog.shutdown().catch(() => undefined);
  }
}
