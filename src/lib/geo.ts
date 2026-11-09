/**
 * Postcode lookups through postcodes.io, a free, open-source service built
 * on official open data (no account or key needed). Used to check that a
 * postcode exists, to find where it is (for distance-based matching) and to
 * turn a "use my location" position into the nearest postcode. Lookups are
 * cautious: if the service can't be reached, callers carry on without it.
 * Server only.
 */
import { normalisePostcode } from "@/lib/postcode";

const API = "https://api.postcodes.io";
const TIMEOUT_MS = 2500;

export interface PostcodeInfo {
  postcode: string;
  lat: number;
  lng: number;
  /** "England", "Scotland", "Wales" or "Northern Ireland". */
  country: string;
}

const cache = new Map<string, PostcodeInfo | null>();

/**
 * Looks up a postcode. Returns its details, `null` if it doesn't exist, or
 * `undefined` if we couldn't tell (the service didn't answer).
 */
export async function lookupPostcode(input: string): Promise<PostcodeInfo | null | undefined> {
  const pc = normalisePostcode(input);
  if (!pc) return null;
  if (cache.has(pc)) return cache.get(pc);
  try {
    const res = await fetch(`${API}/postcodes/${encodeURIComponent(pc)}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status === 404) {
      cache.set(pc, null);
      return null;
    }
    if (!res.ok) return undefined;
    const r = ((await res.json()) as { result: { postcode: string; latitude: number | null; longitude: number | null; country: string } }).result;
    // A few valid postcodes (for example some PO boxes) have no location.
    if (r.latitude === null || r.longitude === null) return undefined;
    const info = { postcode: normalisePostcode(r.postcode) ?? pc, lat: r.latitude, lng: r.longitude, country: r.country };
    cache.set(pc, info);
    return info;
  } catch {
    return undefined;
  }
}

/** The nearest postcode to a position, or null if none is close or the service didn't answer. */
export async function nearestPostcode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lon: String(lng), lat: String(lat), limit: "1", radius: "1000" });
    const res = await fetch(`${API}/postcodes?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const result = ((await res.json()) as { result: { postcode: string }[] | null }).result;
    return result?.[0] ? normalisePostcode(result[0].postcode) : null;
  } catch {
    return null;
  }
}

/** Straight-line distance in miles between two points. */
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}
