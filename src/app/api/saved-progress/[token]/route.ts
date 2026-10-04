import { SAVED_PROGRESS_MONTHS } from "@/lib/consent";
import { recordStore } from "@/lib/records";
import { jsonError } from "@/lib/request";

type Context = { params: Promise<{ token: string }> };

function expired(createdAt: string): boolean {
  const limit = new Date(createdAt);
  limit.setUTCMonth(limit.getUTCMonth() + SAVED_PROGRESS_MONTHS);
  return limit < new Date();
}

/** Returns the saved answers (not the email address) so the person can carry on. */
export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  const saved = await recordStore.getProgress(token);
  if (!saved || expired(saved.createdAt)) {
    if (saved) await recordStore.deleteProgress(token);
    return jsonError("We couldn't find those saved answers. They may have been deleted.", 404);
  }
  return Response.json({ serviceSlug: saved.serviceSlug, answers: saved.answers, createdAt: saved.createdAt });
}

/** Deletes saved answers. Succeeds even if they were already gone. */
export async function DELETE(_request: Request, { params }: Context) {
  const { token } = await params;
  await recordStore.deleteProgress(token);
  return new Response(null, { status: 204 });
}
