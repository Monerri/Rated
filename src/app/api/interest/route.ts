import { getService } from "@/config/services";
import { notifyServiceAvailableWording } from "@/lib/consent";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import { EMAIL, jsonError, parseSource, readJson, str } from "@/lib/request";
import type { InterestRegistration } from "@/lib/types";

/**
 * Register interest in a service that isn't available to this person yet:
 * either a coming-soon service, or a live service outside the areas we cover.
 * This never creates an enquiry and nothing is passed to a specialist.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("We couldn't read that request.");

  const service = getService(String(body.serviceSlug ?? ""));
  if (!service) return jsonError("That service isn't open for registrations.");

  const postcode = typeof body.postcode === "string" ? normalisePostcode(body.postcode) : null;
  if (body.postcode && !postcode) return jsonError("Please enter a valid UK postcode.");

  if (service.status === "live") {
    // Live services only take registrations from postcodes we don't cover yet.
    const region = postcode ? regionForPostcode(postcode) : null;
    if (!postcode || (region && service.regions.includes(region))) {
      return jsonError("That service is already available in your area.");
    }
  }

  const firstName = str(body.firstName, 80);
  if (!firstName) return jsonError("Please enter your first name.");

  const email = str(body.email, 254);
  if (!email || !EMAIL.test(email)) return jsonError("Please enter a valid email address.");

  // Consent must be given, and the wording must be the version we actually show.
  const expected = notifyServiceAvailableWording(service.name);
  const consent = body.consent as { wordingId?: unknown; wording?: unknown; given?: unknown } | undefined;
  if (consent?.given !== true) return jsonError("Please tick the box so we can email you.");
  if (consent.wordingId !== expected.wordingId || consent.wording !== expected.wording) {
    return jsonError("This form is out of date. Please refresh the page.", 409);
  }

  const now = new Date().toISOString();
  const record: InterestRegistration = {
    kind: "interest_registration",
    serviceSlug: service.slug,
    firstName,
    email,
    postcodeArea: str(body.postcodeArea, 12),
    postcode,
    consent: {
      purpose: "notify_service_available",
      serviceSlug: service.slug,
      wordingId: expected.wordingId,
      wording: expected.wording,
      given: true,
      givenAt: now,
    },
    source: parseSource(body.source),
    createdAt: now,
  };

  const { id } = await recordStore.saveInterestRegistration(record);
  return Response.json({ id }, { status: 201 });
}
