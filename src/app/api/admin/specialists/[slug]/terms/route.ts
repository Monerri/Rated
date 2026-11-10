import { adminRole } from "@/lib/admin";
import { linkOrigin, sendTermsInvite } from "@/lib/onboarding";
import { recordStore } from "@/lib/records";
import { jsonError } from "@/lib/request";

type Context = { params: Promise<{ slug: string }> };

/** Sends a new link to accept the Specialist terms. Any earlier link stops working. */
export async function POST(request: Request, { params }: Context) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const { slug } = await params;
  const s = (await recordStore.listSpecialists()).find((x) => x.slug === slug);
  if (!s?.onboarding) return jsonError("Specialist not found.", 404);
  if (s.onboarding.status === "active") return jsonError("They've already accepted the terms.");
  const { sent } = await sendTermsInvite(s, role, linkOrigin(request));
  return sent ? Response.json({ sent }) : jsonError("The email couldn't be sent. Please try again.", 502);
}
