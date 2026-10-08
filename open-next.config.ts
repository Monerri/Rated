import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Pages are pre-built at deploy time and served as static assets, which keeps
 * the site within the Workers free plan. A scheduled daily deploy (see
 * .github/workflows/deploy.yml) publishes blog posts on their date.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
