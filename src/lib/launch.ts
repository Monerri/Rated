import { regions } from "@/config/regions";
import { getService } from "@/config/services";
import { getFunnel } from "@/funnels";
import { serviceAvailableEmail, trySend } from "@/lib/notifications";
import { regionForPostcode } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import type { InterestRegistration, ServiceStatus } from "@/lib/types";

function regionOf(r: InterestRegistration): string | null {
  if (r.postcode) return regionForPostcode(r.postcode);
  if (r.postcodeArea) return regions.find((x) => x.postcodeAreas.some((a) => a.code === r.postcodeArea))?.slug ?? null;
  return null;
}

export type ChangeResult =
  | { ok: true; status: ServiceStatus; regions: string[]; notified: number }
  | { ok: false; error: string };

/**
 * Changes a service's availability at runtime. When a service goes live in a
 * region, everyone who registered interest there (and hasn't unsubscribed or
 * already been told) gets the single "now available" email their consent
 * covers. People who didn't give an area are told too, with the region named.
 */
export async function setServiceAvailability(
  serviceSlug: string,
  status: ServiceStatus,
  regionSlugs: string[],
  origin: string,
): Promise<ChangeResult> {
  const service = getService(serviceSlug);
  if (!service) return { ok: false, error: "Unknown service." };
  if (status === "live" && !getFunnel(serviceSlug)) {
    return { ok: false, error: "This service has no questionnaire yet, so it can't go live." };
  }
  const unknown = regionSlugs.filter((r) => !regions.some((x) => x.slug === r));
  if (unknown.length) return { ok: false, error: `Unknown regions: ${unknown.join(", ")}` };
  if (status === "live" && regionSlugs.length === 0) return { ok: false, error: "Choose at least one region." };

  await recordStore.saveServiceOverride({
    serviceSlug,
    status,
    regions: status === "live" ? regionSlugs : [],
    changedAt: new Date().toISOString(),
  });

  let notified = 0;
  if (status === "live") {
    const registrations = await recordStore.listInterestRegistrations(serviceSlug);
    for (const r of registrations) {
      if (r.unsubscribedAt || r.notifiedAt) continue;
      const region = regionOf(r);
      if (region !== null && !regionSlugs.includes(region)) continue;
      const regionName = regions.find((x) => x.slug === (region ?? regionSlugs[0]))!.name;
      if (!(await trySend(serviceAvailableEmail(r, service.name, serviceSlug, regionName, origin)))) continue;
      await recordStore.updateInterestRegistration(r.token, { notifiedAt: new Date().toISOString() });
      notified++;
    }
  }
  return { ok: true, status, regions: status === "live" ? regionSlugs : [], notified };
}
