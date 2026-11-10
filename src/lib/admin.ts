import { timingSafeEqual } from "node:crypto";
import { bindings } from "@/lib/cloudflare";
import type { AdminRole } from "@/lib/types";

/**
 * Admin routes are disabled unless the ADMIN_API_TOKEN secret is set, and
 * then need a token as a Bearer token:
 * - ADMIN_API_TOKEN signs in as the owner, who can do everything.
 * - ASSISTANT_API_TOKEN (optional) signs in as an assistant, who can review
 *   and approve specialists and record top-ups, refunds and adjustments, but
 *   can't pay out or forfeit credits or change which services are live.
 *   Change or delete that secret in Cloudflare to remove their access.
 * The weekly report can also be triggered by the Worker's own scheduled job
 * (see worker.ts), which passes a key that only exists inside the running Worker.
 */
export function adminRole(request: Request): AdminRole | null {
  const given = (request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "").trim();
  const cronKey = (globalThis as { __vnCronKey?: string }).__vnCronKey;
  const owner = secret("ADMIN_API_TOKEN");
  if (matches(given, owner) || matches(given, cronKey)) return "owner";
  // An assistant can only sign in while the owner's token is set too.
  if (owner && matches(given, secret("ASSISTANT_API_TOKEN"))) return "assistant";
  return null;
}

export function authorised(request: Request): boolean {
  return adminRole(request) !== null;
}

/**
 * A secret by name. The name is matched in any capitalisation (so
 * "Admin_API_Token" works too) and surrounding spaces from pasting are ignored.
 */
function secret(name: string): string | undefined {
  const sources = [bindings() as Record<string, unknown>, process.env as Record<string, unknown>];
  for (const source of sources) {
    const key = Object.keys(source).find((k) => k.toUpperCase() === name);
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
