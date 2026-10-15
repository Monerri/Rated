import { getService } from "@/config/services";
import { getSpecialist } from "@/data/specialists";
import { publishConsentWording, submitFeedback, type FeedbackInput } from "@/lib/feedback";
import { recordStore } from "@/lib/records";
import { jsonError, readJson } from "@/lib/request";

type Context = { params: Promise<{ token: string }> };

/** What the feedback page needs: the specialists to ask about, and any earlier answers. */
export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  const record = await recordStore.getFeedback(token);
  if (!record) return jsonError("We couldn't find that feedback link.", 404);
  return Response.json({
    firstName: record.firstName,
    serviceName: getService(record.serviceSlug)?.name ?? record.serviceSlug,
    specialists: record.specialistSlugs.map((slug) => ({ slug, name: getSpecialist(slug)?.name ?? slug })),
    responses: record.responses,
    publishWording: publishConsentWording(record.firstName, record.area).wording,
  });
}

export async function POST(request: Request, { params }: Context) {
  const { token } = await params;
  const body = await readJson(request);
  if (!body || typeof body.responses !== "object" || body.responses === null) return jsonError("We couldn't read that request.");
  const result = await submitFeedback(token, body.responses as FeedbackInput);
  if (!result.ok) return jsonError(result.error, result.status);
  return new Response(null, { status: 204 });
}
