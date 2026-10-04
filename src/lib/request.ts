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

export function requestOrigin(request: Request): string {
  return process.env.SITE_URL ?? new URL(request.url).origin;
}
