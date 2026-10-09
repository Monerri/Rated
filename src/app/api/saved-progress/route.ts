import { getCatalogueService } from "@/lib/catalogue";
import { getFunnel } from "@/funnels";
import { validateAnswers } from "@/funnels/engine";
import { retainProgressWording } from "@/lib/consent";
import { savedProgressEmail, trySend } from "@/lib/notifications";
import { recordStore } from "@/lib/records";
import { EMAIL, jsonError, parseSource, readJson, requestOrigin, str } from "@/lib/request";
import type { SavedProgress } from "@/lib/types";

/** Save answers for someone who is "not quite ready". Nothing is shared with a specialist. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("We couldn't read that request.");

  const service = await getCatalogueService(String(body.serviceSlug ?? ""));
  const funnel = service && getFunnel(service.slug);
  if (!service || !funnel) return jsonError("That service isn't available.");

  const validated = validateAnswers(funnel, body.answers);
  if (!validated.ok) return jsonError(validated.error);

  const email = str(body.email, 254);
  if (!email || !EMAIL.test(email)) return jsonError("Please enter a valid email address.");

  const expected = retainProgressWording();
  const consent = (body.consent ?? {}) as Record<string, unknown>;
  if (consent.given !== true || consent.wordingId !== expected.wordingId || consent.wording !== expected.wording) {
    return jsonError("Please tick the box so we can save your answers.");
  }

  const now = new Date().toISOString();
  const record: SavedProgress = {
    kind: "saved_progress",
    token: crypto.randomUUID(),
    serviceSlug: service.slug,
    answers: validated.answers,
    email,
    consent: {
      purpose: "retain_progress",
      serviceSlug: service.slug,
      wordingId: expected.wordingId,
      wording: expected.wording,
      given: true,
      givenAt: now,
    },
    source: parseSource(body.source),
    createdAt: now,
  };
  await recordStore.saveProgress(record);
  if (!(await trySend(savedProgressEmail(record, service.name, requestOrigin(request))))) {
    // Without the email they have no delete link, so don't keep the answers.
    await recordStore.deleteProgress(record.token);
    return jsonError("We couldn't send the email with your link. Please check your email address and try again.", 502);
  }

  return Response.json({ token: record.token }, { status: 201 });
}
