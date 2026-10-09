import { getCatalogueService } from "@/lib/catalogue";
import { notifyServiceAvailableWording } from "@/lib/consent";
import { normalisePostcode, postcodeArea, regionForPostcode } from "@/lib/postcode";
import { knownPostcodeArea } from "@/config/regions";
import { interestConfirmationEmail, trySend } from "@/lib/notifications";
import { recordStore } from "@/lib/records";
import { EMAIL, jsonError, parseSource, readJson, requestOrigin, str } from "@/lib/request";
import type { InterestRegistration } from "@/lib/types";

/**
 * Register interest in a service that isn't available to this person yet:
 * either a coming-soon service, or a live service outside the areas we cover.
 * This never creates an enquiry and nothing is passed to a specialist.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("We couldn't read that request.");

  const service = await getCatalogueService(String(body.serviceSlug ?? ""));
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
    token: crypto.randomUUID(),
    serviceSlug: service.slug,
    firstName,
    email,
    postcodeArea: knownPostcodeArea(str(body.postcodeArea, 12) ?? undefined) ?? (postcode ? postcodeArea(postcode) : null),
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
    notifiedAt: null,
    unsubscribedAt: null,
  };

  await recordStore.saveInterestRegistration(record);
  if (!(await trySend(interestConfirmationEmail(record, service.name, requestOrigin(request))))) {
    // Without the confirmation they have no unsubscribe link, so don't keep the registration.
    await recordStore.deleteInterestRegistration(record.token);
    return jsonError("We couldn't send your confirmation email. Please check your email address and try again.", 502);
  }
  return new Response(null, { status: 201 });
}
