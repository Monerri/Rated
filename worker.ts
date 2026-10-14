// The Worker entry point: the OpenNext-built site, plus a scheduled job.
// Built by `opennextjs-cloudflare build`. This file is bundled by Wrangler, not type-checked (see tsconfig.json).
import { default as site } from "./.open-next/worker.js";

interface ScheduledEnv {
  SITE_URL?: string;
}

const worker = {
  fetch: site.fetch,

  /**
   * Runs on the cron schedule in wrangler.jsonc (Mondays 07:05 UTC) and asks
   * the site to send the weekly reports. The key it passes exists only inside
   * this running Worker, so the route can't be triggered from outside
   * without ADMIN_API_TOKEN.
   */
  async scheduled(_controller: unknown, env: ScheduledEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const key = crypto.randomUUID();
    (globalThis as { __vnCronKey?: string }).__vnCronKey = key;
    const request = new Request(`${env.SITE_URL ?? "https://vettednorth.com"}/api/admin/weekly-report`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}` },
    });
    const response: Response = await site.fetch(request, env, ctx);
    console.info("Weekly reports", response.status, await response.text());
  },
};

export default worker;
