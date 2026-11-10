import { coverageTarget, coverageTowns } from "@/config/coverageTowns";
import { adminRole } from "@/lib/admin";
import { getCatalogueLists } from "@/lib/catalogue";
import { switchedOffByHand } from "@/lib/listing";
import { covers } from "@/lib/matching";
import { activeSpecialists } from "@/lib/specialistDirectory";
import { jsonError } from "@/lib/request";
import { isCurrentlyVetted } from "@/lib/vetting";

/**
 * How many real specialists could take a lead for each live service in each
 * town: accepted the terms, vetted, not switched off by hand. Demo companies
 * aren't counted. Balances aren't checked, since a top-up is quick.
 */
export async function GET(request: Request) {
  if (!adminRole(request)) return jsonError("Not found.", 404);
  const [{ live }, list, off] = await Promise.all([getCatalogueLists(), activeSpecialists(), switchedOffByHand()]);
  const real = list.filter((s) => !s.isDemo && !off.has(s.slug) && isCurrentlyVetted(s));
  const rows = live.map((service) => ({
    service: service.name,
    counts: coverageTowns.map((t) =>
      real.filter((s) => s.services.includes(service.slug) && covers(s, { area: t.area, outward: t.outward, point: { lat: t.lat, lng: t.lng } })).length,
    ),
  }));
  return Response.json({ towns: coverageTowns.map((t) => t.name), rows, target: coverageTarget, specialists: real.length });
}
