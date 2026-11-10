import { getService } from "@/config/services";
import { specialistNames } from "@/lib/specialistDirectory";
import { authorised } from "@/lib/admin";
import { recordStore } from "@/lib/records";
import { jsonError } from "@/lib/request";

/** Feedback answered in the last 90 days, newest first. No homeowner contact details. */
export async function GET(request: Request) {
  if (!authorised(request)) return jsonError("Not found.", 404);
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const records = (await recordStore.listFeedback(since)).filter((r) => r.respondedAt);
  const known = await specialistNames();
  return Response.json({
    feedback: records.flatMap((r) =>
      Object.entries(r.responses).map(([slug, f]) => ({
        respondedAt: r.respondedAt,
        specialist: known[slug] ?? slug,
        service: getService(r.serviceSlug)?.name ?? r.serviceSlug,
        area: r.area,
        firstName: r.firstName,
        contacted: f.contacted,
        rating: f.rating,
        comment: f.comment,
        mayQuote: !!f.publishConsent,
      })),
    ),
  });
}
