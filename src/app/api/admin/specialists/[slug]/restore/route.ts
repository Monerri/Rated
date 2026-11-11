import { adminRole } from "@/lib/admin";
import { restoreSpecialist } from "@/lib/onboarding";
import { jsonError } from "@/lib/request";

type Context = { params: Promise<{ slug: string }> };

/** Restores a removed specialist (owner only). */
export async function POST(request: Request, { params }: Context) {
  if (adminRole(request) !== "owner") return jsonError("Only the owner can restore a specialist.", 403);
  const { slug } = await params;
  const result = await restoreSpecialist(slug, "owner");
  return result.ok ? Response.json(result) : jsonError(result.error, result.status);
}
