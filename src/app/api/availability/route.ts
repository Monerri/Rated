import { getService } from "@/config/services";
import { hasCoverage } from "@/lib/matching";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
import { jsonError } from "@/lib/request";
import type { NextRequest } from "next/server";

/**
 * Whether a vetted specialist covers an area for a service. Never reveals
 * who, so it is safe to call before someone has agreed to be put in touch.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const service = getService(params.get("service") ?? "");
  if (!service || service.status !== "live") return jsonError("Unknown service.");

  const postcode = normalisePostcode(params.get("postcode") ?? "");
  const area = (params.get("area") ?? "").toUpperCase();
  const target = postcode ?? area;
  if (!target) return jsonError("Missing area or postcode.");

  const covered = postcode ? regionForPostcode(postcode) !== null : true;
  return Response.json({ available: covered && hasCoverage(service.slug, target) });
}
