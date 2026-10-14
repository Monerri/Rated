import { timingSafeEqual } from "node:crypto";
import { bindings } from "@/lib/cloudflare";

/**
 * Admin routes are disabled unless the ADMIN_API_TOKEN secret is set, and
 * then need it as a Bearer token. The weekly report can also be triggered
 * by the Worker's own scheduled job (see worker.ts), which passes a key that
 * only exists inside the running Worker.
 */
export function authorised(request: Request): boolean {
  const given = (request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "").trim();
  const cronKey = (globalThis as { __vnCronKey?: string }).__vnCronKey;
  return matches(given, adminToken()) || matches(given, cronKey);
}

/**
 * The admin token. The name is matched in any capitalisation (so
 * "Admin_API_Token" works too) and surrounding spaces from pasting are ignored.
 */
function adminToken(): string | undefined {
  const sources = [bindings() as Record<string, unknown>, process.env as Record<string, unknown>];
  for (const source of sources) {
    const key = Object.keys(source).find((k) => k.toUpperCase() === "ADMIN_API_TOKEN");
    const value = key ? source[key] : undefined;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function matches(given: string, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
