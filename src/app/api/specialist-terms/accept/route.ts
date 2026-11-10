import { acceptTerms } from "@/lib/onboarding";
import { jsonError, readJson, str } from "@/lib/request";

/** A specialist accepting the Specialist terms from the link we emailed. */
export async function POST(request: Request) {
  const body = await readJson(request);
  const consent = (body?.consent ?? {}) as Record<string, unknown>;
  const result = await acceptTerms(String(body?.token ?? ""), str(body?.name, 120) ?? "", {
    wordingId: String(consent.wordingId ?? ""),
    wording: String(consent.wording ?? ""),
    given: consent.given === true,
  });
  if (!result.ok) return jsonError(result.error, result.status);
  return Response.json({ accepted: true });
}
