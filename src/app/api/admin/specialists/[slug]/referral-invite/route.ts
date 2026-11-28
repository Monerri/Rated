import { adminRole } from "@/lib/admin";
import { linkOrigin } from "@/lib/onboarding";
import { sendReferralInviteNow } from "@/lib/referralInvites";
import { jsonError } from "@/lib/request";

/** Sends the referral invite email to one specialist now (for example someone who went live before it was automatic). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!adminRole(request)) return jsonError("Not found.", 404);
  const { slug } = await params;
  const result = await sendReferralInviteNow(slug, linkOrigin(request).replace(/\/$/, ""));
  return result.ok ? Response.json({ sent: true }) : jsonError(result.error);
}
