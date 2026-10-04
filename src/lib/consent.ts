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

export function shareWithSpecialistWording(serviceName: string) {
  return {
    wordingId: "share_with_specialist.v1",
    wording: `I agree that ${site.name} can share my contact details and answers with one vetted ${serviceName} specialist covering my area, so they can contact me about this project.`,
  };
}

/** How long saved progress is kept before it is deleted automatically. */
export const SAVED_PROGRESS_MONTHS = 6;

export function retainProgressWording() {
  return {
    wordingId: "retain_progress.v1",
    wording: `Save my answers so I can carry on later. ${site.name} will keep them for up to ${SAVED_PROGRESS_MONTHS} months, won't share them with anyone, and will delete them sooner if I ask.`,
  };
}
