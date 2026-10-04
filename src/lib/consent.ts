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
