import type { SourceInfo } from "@/lib/types";

/** Trimmed, length-limited string, or null if missing or empty. */
export function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** UK phone numbers: 10 or 11 digits starting 0, or +44 followed by 9 or 10 digits. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  if (/^0\d{9,10}$/.test(digits)) return digits;
  if (/^\+44\d{9,10}$/.test(digits)) return `0${digits.slice(3)}`;
  return null;
}

export function parseSource(input: unknown): SourceInfo {
  const src = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const utm = (typeof src.utm === "object" && src.utm !== null ? src.utm : {}) as Record<string, unknown>;
  return {
    referrer: str(src.referrer, 500),
    landingPath: str(src.landingPath, 200),
    utm: Object.fromEntries(
      (["source", "medium", "campaign", "term", "content"] as const)
        .map((k) => [k, str(utm[k], 200)])
        .filter(([, v]) => v !== null),
    ),
  };
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? body : null;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * The address the visitor is using, for links in emails. A Worker only
 * receives requests for its own domains, so this is always one of ours, and
 * links keep working on workers.dev before the main domain is connected.
 */
export function requestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

/** Companies House number: 8 digits, or 2 letters and 6 digits (for example SC123456). Pads short numbers. */
export function normaliseCompanyNumber(input: string): string | null {
  const v = input.toUpperCase().replace(/\s+/g, "");
  if (/^\d{6,8}$/.test(v)) return v.padStart(8, "0");
  if (/^[A-Z]{2}\d{6}$/.test(v)) return v;
  return null;
}

/** An http(s) URL, adding https:// if it was left off. */
export function normaliseUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}
