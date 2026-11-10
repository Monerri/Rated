import { adminRole } from "@/lib/admin";
import { buildSpecialist, parseDraft } from "@/lib/onboarding";
import { recordStore } from "@/lib/records";
import { jsonError, readJson } from "@/lib/request";

type Context = { params: Promise<{ slug: string }> };

/** Updates a specialist's details or checks. Their terms acceptance and history are kept. */
export async function PUT(request: Request, { params }: Context) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const { slug } = await params;
  const existing = (await recordStore.listSpecialists()).find((s) => s.slug === slug);
  if (!existing) return jsonError("Specialist not found.", 404);
  const parsed = parseDraft(await readJson(request));
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 400 });
  const built = await buildSpecialist(parsed.draft, role, existing, existing.onboarding?.applicationId ?? null);
  if (!built.ok) return Response.json({ errors: built.errors }, { status: 400 });
  await recordStore.saveSpecialist(built.specialist);
  return Response.json({ specialist: built.specialist });
}
