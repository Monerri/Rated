import { timingSafeEqual } from "node:crypto";

/**
 * Admin routes are disabled unless the ADMIN_API_TOKEN secret is set, and
 * then need it as a Bearer token. The weekly report can also be triggered
 * by the Worker's own scheduled job (see worker.ts), which passes a key that
 * only exists inside the running Worker.
 */
export function authorised(request: Request): boolean {
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const cronKey = (globalThis as { __vnCronKey?: string }).__vnCronKey;
  return matches(given, process.env.ADMIN_API_TOKEN) || matches(given, cronKey);
}

function matches(given: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
