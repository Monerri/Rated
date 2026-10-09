import { site } from "@/config/site";

/**
 * Consent wording is versioned. The id and the exact text are stored with
 * every record, so we can always show what someone agreed to.
 * Change the wording by adding a new version, never by editing an old one.
 */

export function notifyServiceAvailableWording(serviceName: string) {
  return {
    wordingId: "notify_service_available.v1",
    wording: `Email me when ${serviceName} becomes available in my area. I can unsubscribe at any time.`,
  };
}

const NUMBER_WORDS = ["", "one", "two", "three"];

/** The most specialists a homeowner can ask to hear from. */
export const MAX_SPECIALISTS = 3;

/**
 * v1 (single specialist) is retired; records keep the wording they were given.
 * v2 names the number of specialists the homeowner chose.
 */
export function shareWithSpecialistWording(serviceName: string, count: number) {
  const n = Math.min(Math.max(1, Math.round(count)), MAX_SPECIALISTS);
  const who =
    n === 1
      ? `one vetted ${serviceName} specialist`
      : `up to ${NUMBER_WORDS[n]} vetted ${serviceName} specialists`;
  return {
    wordingId: "share_with_specialists.v2",
    wording: `I agree that ${site.name} can share my contact details and answers with ${who} covering my area, so they can contact me about this project.`,
  };
}

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** How long saved progress is kept before it is deleted automatically. */
export const SAVED_PROGRESS_MONTHS = 12;

export function retainProgressWording() {
  return {
    wordingId: "retain_progress.v2",
    wording: `Save my answers so I can carry on later. ${site.name} will keep them for up to ${SAVED_PROGRESS_MONTHS} months, won't share them with anyone, and will delete them sooner if I ask.`,
  };
}
