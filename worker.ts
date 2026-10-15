// The Worker entry point: the OpenNext-built site, plus scheduled jobs.
// Built by `opennextjs-cloudflare build`. This file is bundled by Wrangler, not type-checked (see tsconfig.json).
import { default as site } from "./.open-next/worker.js";

interface ScheduledEnv {
  SITE_URL?: string;
  /** The address used in links in scheduled emails. Falls back to SITE_URL. */
  LINK_ORIGIN?: string;
}

/** Cron schedules in wrangler.jsonc, and the site route each one calls. */
const JOBS: Record<string, string> = {
  "5 7 * * 1": "/api/admin/weekly-report", // Mondays 07:05 UTC
  "40 9 * * *": "/api/admin/daily-tasks", // Every day 09:40 UTC
};

const worker = {
  fetch: site.fetch,

  /**
   * Runs on the cron schedules in wrangler.jsonc and asks the site to do
   * that job. The key it passes exists only inside this running Worker, so
   * the routes can't be triggered from outside without ADMIN_API_TOKEN.
   */
  async scheduled(controller: { cron: string }, env: ScheduledEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const path = JOBS[controller.cron];
    if (!path) return console.warn("No job for schedule", controller.cron);
    const key = crypto.randomUUID();
    (globalThis as { __vnCronKey?: string }).__vnCronKey = key;
    const origin = env.LINK_ORIGIN ?? env.SITE_URL ?? "https://vettednorth.com";
    const request = new Request(`${origin}${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, host: new URL(origin).host },
    });
    const response: Response = await site.fetch(request, env, ctx);
    console.info(path, response.status, await response.text());
  },
};

export default worker;
