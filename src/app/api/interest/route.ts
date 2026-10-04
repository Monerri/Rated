import { getService } from "@/config/services";
import { notifyServiceAvailableWording } from "@/lib/consent";
import { recordStore } from "@/lib/records";
import type { InterestRegistration, SourceInfo } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;
}

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error("We couldn't read that request.");
  }

  const service = getService(String(body.serviceSlug ?? ""));
  if (!service || service.status !== "coming_soon") return error("That service isn't open for registrations.");

  const firstName = str(body.firstName, 80);
  if (!firstName) return error("Please enter your first name.");

  const email = str(body.email, 254);
  if (!email || !EMAIL.test(email)) return error("Please enter a valid email address.");

  // Consent must be given, and the wording must be the version we actually show.
  const expected = notifyServiceAvailableWording(service.name);
  const consent = body.consent as { wordingId?: unknown; wording?: unknown; given?: unknown } | undefined;
  if (consent?.given !== true) return error("Please tick the box so we can email you.");
  if (consent.wordingId !== expected.wordingId || consent.wording !== expected.wording) {
    return error("This form is out of date. Please refresh the page.", 409);
  }

  const src = (body.source ?? {}) as Partial<SourceInfo>;
  const source: SourceInfo = {
    referrer: str(src.referrer, 500),
    landingPath: str(src.landingPath, 200),
    utm: Object.fromEntries(
      (["source", "medium", "campaign", "term", "content"] as const)
        .map((k) => [k, str((src.utm as Record<string, unknown> | undefined)?.[k], 200)])
        .filter(([, v]) => v !== null),
    ),
  };

  const now = new Date().toISOString();
  const record: InterestRegistration = {
    kind: "interest_registration",
    serviceSlug: service.slug,
    firstName,
    email,
    postcodeArea: str(body.postcodeArea, 12),
    consent: {
      purpose: "notify_service_available",
      serviceSlug: service.slug,
      wordingId: expected.wordingId,
      wording: expected.wording,
      given: true,
      givenAt: now,
    },
    source,
    createdAt: now,
  };

  const { id } = await recordStore.saveInterestRegistration(record);
  return Response.json({ id }, { status: 201 });
}
