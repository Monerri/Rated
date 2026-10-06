import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { setServiceAvailability } from "@/lib/launch";
import { jsonError, readJson, requestOrigin } from "@/lib/request";

type Context = { params: Promise<{ service: string }> };

function authorised(request: Request): boolean {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Switch a service between coming soon and live, without a rebuild.
 *
 *   curl -X POST /api/admin/services/solar-battery \
 *     -H "Authorization: Bearer $ADMIN_API_TOKEN" \
 *     -d '{"status":"live","regions":["north-east-england"]}'
 *
 * Disabled unless ADMIN_API_TOKEN is set. Temporary until an admin screen exists.
 */
export async function POST(request: Request, { params }: Context) {
  if (!authorised(request)) return jsonError("Not found.", 404);

  const body = await readJson(request);
  const status = body?.status;
  if (status !== "live" && status !== "coming_soon") return jsonError('status must be "live" or "coming_soon".');
  const regionSlugs = Array.isArray(body?.regions) ? body.regions.map(String) : [];

  const { service } = await params;
  const result = await setServiceAvailability(service, status, regionSlugs, requestOrigin(request));
  if (!result.ok) return jsonError(result.error);

  // Refresh every cached page that lists services.
  revalidatePath("/", "layout");
  return Response.json(result);
}
