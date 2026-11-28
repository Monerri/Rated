import { adminRole } from "@/lib/admin";
import { recordStore } from "@/lib/records";
import { blockingFlags, confirmReferral, flagLabels, referralFlags, suggestRecommenders } from "@/lib/referrals";
import { jsonError, readJson, str } from "@/lib/request";
import type { ReferralFlag } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

/**
 * The referral on one application: what the applicant typed, suggested
 * matches, the flags for a chosen recommender (?recommender=slug, or the top
 * suggestion), and any confirmation or award so far. Owner and assistant can
 * look; only the owner can confirm (POST).
 */
export async function GET(request: Request, { params }: Context) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const { id } = await params;
  const application = await recordStore.getSupplierApplication(id);
  if (!application) return jsonError("Application not found.", 404);
  const [specialists, applications, confirmation, award] = await Promise.all([
    recordStore.listSpecialists(),
    recordStore.listSupplierApplications(),
    recordStore.getReferralConfirmation(id),
    recordStore.getReferralAward(id),
  ]);
  const suggestions = suggestRecommenders(application.recommendedBy?.name ?? "", specialists);
  const chosenSlug = new URL(request.url).searchParams.get("recommender") ?? confirmation?.recommenderSlug ?? suggestions[0]?.slug ?? null;
  const recommender = specialists.find((s) => s.slug === chosenSlug) ?? null;
  const flags = referralFlags({ application, recommender, applications, specialists });
  const names = (slug: string) => specialists.find((s) => s.slug === slug)?.name ?? slug;
  return Response.json({
    recommendedBy: application.recommendedBy ?? null,
    suggestions: suggestions.map((s) => ({ slug: s.slug, name: s.name })),
    approved: specialists
      .filter((s) => !s.isDemo && s.onboarding?.status === "active")
      .map((s) => ({ slug: s.slug, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    chosen: recommender ? { slug: recommender.slug, name: recommender.name } : null,
    flags: flags.map((f) => ({ ...f, label: flagLabels[f.flag], blocking: blockingFlags.includes(f.flag) })),
    confirmation: confirmation ? { ...confirmation, recommenderName: names(confirmation.recommenderSlug) } : null,
    award: award ? { ...award, recommenderName: names(award.recommenderSlug), recommendedName: names(award.recommendedSlug) } : null,
    canConfirm: role === "owner",
  });
}

const OVERRIDABLE: ReferralFlag[] = ["not_new", "connected"];

/** Body: { recommenderSlug, overrides: { not_new?: string, connected?: string }, ownershipChecked: boolean }. Owner only. */
export async function POST(request: Request, { params }: Context) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  if (role !== "owner") return jsonError("Only the owner can confirm referrals.", 403);
  const { id } = await params;
  const application = await recordStore.getSupplierApplication(id);
  if (!application) return jsonError("Application not found.", 404);
  const body = await readJson(request);
  const recommenderSlug = str(body?.recommenderSlug, 120);
  if (!recommenderSlug) return jsonError("Choose the specialist who recommended them.");
  const given = (typeof body?.overrides === "object" && body.overrides !== null ? body.overrides : {}) as Record<string, unknown>;
  const overrides = OVERRIDABLE.flatMap((flag) => {
    const reason = str(given[flag], 500);
    return reason ? [{ flag, reason }] : [];
  });
  const result = await confirmReferral({ application, recommenderSlug, overrides, ownershipChecked: body?.ownershipChecked === true, role });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ outcome: result.outcome });
}
