import { regions } from "@/config/regions";

/** Full UK postcode, for example "NE1 4ST". Excludes special cases like GIR 0AA. */
const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?) ?(\d[A-Z]{2})$/;

/** Uppercases and normalises spacing: "ne14st" -> "NE1 4ST". Returns null if invalid. */
export function normalisePostcode(input: string): string | null {
  const compact = input.toUpperCase().replace(/\s+/g, "");
  const m = compact.match(UK_POSTCODE);
  return m ? `${m[1]} ${m[2]}` : null;
}

/** "NE1 4ST" -> "NE1" */
export function outwardCode(postcode: string): string {
  return postcode.split(" ")[0];
}

/** "NE1 4ST" -> "NE", "TD15 1AA" -> "TD" */
export function postcodeArea(postcode: string): string {
  return outwardCode(postcode).replace(/\d.*$/, "");
}

/** The region slug covering this postcode, if any. */
export function regionForPostcode(postcode: string): string | null {
  const area = postcodeArea(postcode);
  const outward = outwardCode(postcode);
  const region = regions.find(
    (r) => r.postcodeAreas.some((a) => a.code === area) || r.extraOutwardCodes?.includes(outward),
  );
  return region?.slug ?? null;
}
