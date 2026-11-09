import type { NextRequest } from "next/server";
import { lookupPostcode, nearestPostcode } from "@/lib/geo";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
import { jsonError } from "@/lib/request";

/**
 * Two lookups for the postcode question, neither of which stores anything:
 * - ?postcode=NE1 4ST: whether it's a real postcode ("exists" is null if we couldn't check)
 * - ?lat=…&lng=…: the nearest postcode to a position from "Use my location"
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.has("lat") || params.has("lng")) {
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    // Roughly the UK, including Northern Ireland and the islands.
    if (!(lat >= 49 && lat <= 61.5 && lng >= -8.8 && lng <= 2)) {
      return jsonError("That location isn't in the UK.", 422);
    }
    const postcode = await nearestPostcode(lat, lng);
    if (!postcode) return jsonError("We couldn't find a postcode for your location. Please type it instead.", 404);
    return Response.json({ postcode, covered: regionForPostcode(postcode) !== null });
  }

  const postcode = normalisePostcode(params.get("postcode") ?? "");
  if (!postcode) return jsonError("Please enter a full UK postcode, for example NE1 4ST.");
  const info = await lookupPostcode(postcode);
  return Response.json({
    postcode,
    exists: info === undefined ? null : info !== null,
    covered: regionForPostcode(postcode) !== null,
  });
}
