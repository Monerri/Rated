import { adminRole } from "@/lib/admin";
import { removeSpecialist } from "@/lib/onboarding";
import { jsonError, readJson, str } from "@/lib/request";

type Context = { params: Promise<{ slug: string }> };

/** Removes a specialist (owner only). Body: { reason: string, notify: boolean }. Their balance must be zero. */
export async function POST(request: Request, { params }: Context) {
  if (adminRole(request) !== "owner") return jsonError("Only the owner can remove a specialist.", 403);
  const { slug } = await params;
  const body = await readJson(request);
  const reason = str(body?.reason, 500);
  if (!reason) return jsonError("Please give a reason, for our records.");
  const result = await removeSpecialist(slug, "owner", reason, body?.notify === true);
  return result.ok ? Response.json(result) : jsonError(result.error, result.status);
}
