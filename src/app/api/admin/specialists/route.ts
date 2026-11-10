import { adminRole } from "@/lib/admin";
import { buildSpecialist, linkOrigin, parseDraft, recordReview, sendTermsInvite } from "@/lib/onboarding";
import { recordStore } from "@/lib/records";
import { jsonError, readJson } from "@/lib/request";

/** Specialists approved on /admin, with their onboarding details, for editing. */
export async function GET(request: Request) {
  if (!adminRole(request)) return jsonError("Not found.", 404);
  return Response.json({ specialists: await recordStore.listSpecialists() });
}

/**
 * Approves a specialist after their checks: saves them "awaiting terms" and
 * emails them the link to accept the Specialist terms. Body: the form fields
 * (see SpecialistDraft) and, when approving an application, `applicationId`.
 */
export async function POST(request: Request) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const body = await readJson(request);
  const parsed = parseDraft(body);
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 400 });

  const applicationId = typeof body?.applicationId === "string" && body.applicationId ? body.applicationId : null;
  const application = applicationId ? await recordStore.getSupplierApplication(applicationId) : null;
  if (applicationId && !application) return jsonError("Application not found.", 404);
  if (application?.status === "accepted") return jsonError("This application has already been approved.");

  const built = await buildSpecialist(parsed.draft, role, null, applicationId);
  if (!built.ok) return Response.json({ errors: built.errors }, { status: 400 });
  await recordStore.saveSpecialist(built.specialist);
  if (application) await recordReview(application, role, { approvedAs: built.specialist.slug });
  const { sent, specialist } = await sendTermsInvite(built.specialist, role, linkOrigin(request));
  return Response.json({ specialist, termsEmailSent: sent }, { status: 201 });
}
