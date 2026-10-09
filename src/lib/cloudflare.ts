import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The parts of the D1 API we use. Avoids pulling in the full Workers type package. */
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface D1 {
  prepare(sql: string): D1Statement;
}

interface Bindings {
  DB?: D1;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_EMAIL?: string;
}

/**
 * Bindings and secrets for the current request. Empty during the build and
 * under `next dev`, so callers fall back to the prototype behaviour there.
 */
export function bindings(): Bindings {
  try {
    return getCloudflareContext().env as unknown as Bindings;
  } catch {
    return {};
  }
}
