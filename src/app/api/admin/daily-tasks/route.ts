import { authorised } from "@/lib/admin";
import { sendDueFeedbackRequests } from "@/lib/feedback";
import { bindings } from "@/lib/cloudflare";
import { jsonError, requestOrigin } from "@/lib/request";

/** Daily jobs. Called every morning by the Worker's scheduled handler (worker.ts). */
export async function POST(request: Request) {
  if (!authorised(request)) return jsonError("Not found.", 404);
  // Scheduled requests don't come from a browser, so use the configured address for links.
  const { LINK_ORIGIN, SITE_URL } = bindings();
  const origin = LINK_ORIGIN ?? SITE_URL ?? requestOrigin(request);
  return Response.json({ feedback: await sendDueFeedbackRequests(origin.replace(/\/$/, "")) });
}
