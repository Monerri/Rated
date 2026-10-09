import { submitEnquiry } from "@/lib/enquiries";
import { EMAIL, jsonError, normalisePhone, parseSource, readJson, requestOrigin, str } from "@/lib/request";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("We couldn't read that request.");

  const c = (body.contact ?? {}) as Record<string, unknown>;
  const firstName = str(c.firstName, 80);
  const lastName = str(c.lastName, 80);
  const email = str(c.email, 254);
  const phone = typeof c.phone === "string" ? normalisePhone(c.phone) : null;
  if (!firstName || !lastName) return jsonError("Please enter your first and last name.");
  if (!email || !EMAIL.test(email)) return jsonError("Please enter a valid email address.");
  if (!phone) return jsonError("Please enter a UK phone number.");

  const consent = (body.consent ?? {}) as Record<string, unknown>;

  const result = await submitEnquiry({
    serviceSlug: String(body.serviceSlug ?? ""),
    answers: body.answers,
    postcode: String(body.postcode ?? ""),
    contact: { firstName, lastName, email, phone },
    consent: {
      wordingId: String(consent.wordingId ?? ""),
      wording: String(consent.wording ?? ""),
      given: consent.given === true,
    },
    source: parseSource(body.source),
    researchingConfirmed: body.researchingConfirmed === true,
    origin: requestOrigin(request),
  });

  if (!result.ok) return jsonError(result.error, result.status);

  const { enquiry, specialists } = result;
  // Only what the confirmation screen needs. Contact details are not echoed back.
  return Response.json(
    {
      reference: enquiry.id,
      summary: enquiry.summary,
      requested: enquiry.specialistsRequested,
      specialists: specialists.map((s) => ({
        slug: s.slug,
        name: s.name,
        isDemo: s.isDemo,
        services: s.services,
        googleRating: s.googleRating,
        checks: s.checks,
        checksLastConfirmed: s.checksLastConfirmed,
      })),
    },
    { status: 201 },
  );
}
