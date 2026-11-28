import { adminRole } from "@/lib/admin";
import { trySend } from "@/lib/notifications";
import { applicationDeclinedEmail, recordReview } from "@/lib/onboarding";
import { recordStore } from "@/lib/records";
import { jsonError, readJson, str } from "@/lib/request";

type Context = { params: Promise<{ id: string }> };

/**
 * Declines an application. Body: { action: "decline", reason?: string (our
 * records), message?: string (sent to the applicant), sendEmail: boolean }.
 * Or marks the trade it asked for as added: { action: "trade_handled" }, and
 * undoes that with { action: "trade_reopen" }.
 * Approving happens by creating the specialist (POST /api/admin/specialists).
 */
export async function POST(request: Request, { params }: Context) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const { id } = await params;
  const application = await recordStore.getSupplierApplication(id);
  if (!application) return jsonError("Application not found.", 404);
  const body = await readJson(request);
  if (body?.action === "trade_handled" || body?.action === "trade_reopen") {
    const tradeRequestHandled = body.action === "trade_handled" ? { at: new Date().toISOString(), by: role } : null;
    await recordStore.saveSupplierApplication({ ...application, tradeRequestHandled });
    return Response.json({ ok: true });
  }
  if (body?.action !== "decline") return jsonError("Unknown action.");
  if (application.status === "accepted") return jsonError("This application has already been approved.");

  await recordReview(application, role, { declined: str(body?.reason, 500) });
  const emailed = body?.sendEmail === true ? await trySend(applicationDeclinedEmail(application, str(body?.message, 1000))) : false;
  return Response.json({ declined: true, emailed });
}
