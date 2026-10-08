import { getCatalogueService } from "@/lib/catalogue";
import { hasCoverage } from "@/lib/matching";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
import { regions } from "@/config/regions";
import { jsonError } from "@/lib/request";
import type { NextRequest } from "next/server";

/**
 * Whether a vetted specialist covers an area for a service. Never reveals
 * who, so it is safe to call before someone has agreed to be put in touch.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const service = await getCatalogueService(params.get("service") ?? "");
  if (!service || service.status !== "live") return jsonError("Unknown service.");

  const postcode = normalisePostcode(params.get("postcode") ?? "");
  const area = (params.get("area") ?? "").toUpperCase();
  const target = postcode ?? area;
  if (!target) return jsonError("Missing area or postcode.");

  // The postcode or area must be in a region where this service is live.
  const region = postcode
    ? regionForPostcode(postcode)
    : (regions.find((r) => r.postcodeAreas.some((a) => a.code === area))?.slug ?? null);
  const covered = region !== null && service.regions.includes(region);
  return Response.json({ available: covered && hasCoverage(service.slug, target) });
}
