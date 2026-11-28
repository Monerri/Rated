import { referrals, referralsOpen } from "@/config/referrals";
import { site } from "@/config/site";
import { formatCredits } from "@/lib/credits";
import { ordinalDate, ukTime } from "@/lib/format";
import { trySend, type Email } from "@/lib/notifications";
import { recordStore } from "@/lib/records";
import type {
  AdminRole,
  LedgerEntry,
  ReferralAward,
  ReferralConfirmation,
  ReferralFlag,
  Specialist,
  SupplierApplication,
} from "@/lib/types";

/**
 * The referral scheme (Specialist terms, "Referral credits"). An applicant
 * names the specialist who recommended us; the owner confirms the match by
 * hand on /admin (nothing is ever matched or awarded automatically); and once
 * the recommended business is approved and has accepted the terms, both get
 * free "referral_bonus" credits.
 */

/** Flags that always stop an award. The others can be overridden by the owner with a reason. */
export const blockingFlags: ReferralFlag[] = ["recommender_not_approved", "late"];

export const flagLabels: Record<ReferralFlag, string> = {
  recommender_not_approved: "The named recommender isn't an approved specialist",
  not_new: "Not new: already registered, applied or recommended before",
  connected: "Possible self-referral or shared ownership",
  late: `Applied after the deadline (${referrals.lastDay})`,
};

/** Business names compared without case, "Ltd" or "Limited", punctuation or extra spaces. */
export function normaliseBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && w !== "ltd" && w !== "limited")
    .join(" ");
}

/** The trimmed "Who recommended us?" answer, or null when blank. Errors if it's too long. */
export function parseRecommendedBy(input: unknown): { ok: true; name: string | null } | { ok: false; error: string } {
  if (input === undefined || input === null) return { ok: true, name: null };
  if (typeof input !== "string") return { ok: false, error: "Please enter a business name, or leave this blank." };
  const name = input.trim().replace(/\s+/g, " ");
  if (!name) return { ok: true, name: null };
  if (name.length > referrals.maxNameLength) return { ok: false, error: `Please keep this to ${referrals.maxNameLength} characters or fewer.` };
  return { ok: true, name };
}

/** Whether a specialist was approved and had accepted the terms by this moment, and hasn't been removed. */
export function wasActiveAt(s: Specialist, at: string): boolean {
  if (s.isDemo || s.onboarding?.status !== "active") return false;
  const acceptedAt = s.onboarding.terms?.acceptedAt;
  return !acceptedAt || acceptedAt <= at;
}

/**
 * Likely matches for the typed name among active specialists, best first.
 * Only ever a suggestion: the owner picks and confirms the recommender.
 */
export function suggestRecommenders(typed: string, specialists: Specialist[], max = 5): Specialist[] {
  const want = normaliseBusinessName(typed);
  if (!want) return [];
  const wantWords = new Set(want.split(" "));
  const scored = specialists
    .filter((s) => !s.isDemo && s.onboarding?.status === "active")
    .map((s) => {
      const have = normaliseBusinessName(s.name);
      const haveWords = new Set(have.split(" "));
      const shared = [...wantWords].filter((w) => haveWords.has(w)).length;
      const overlap = shared / Math.max(wantWords.size, haveWords.size);
      const score = have === want ? 3 : have.includes(want) || want.includes(have) ? 2 : overlap >= 0.5 ? 1 + overlap / 2 : 0;
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.s);
}

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "outlook.com", "outlook.co.uk", "live.com", "live.co.uk",
  "msn.com", "yahoo.com", "yahoo.co.uk", "icloud.com", "me.com", "mac.com", "aol.com", "aol.co.uk", "btinternet.com",
  "sky.com", "virginmedia.com", "talktalk.net", "protonmail.com", "proton.me", "mail.com", "gmx.co.uk", "gmx.com",
];

const lower = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
const digits = (v: string | null | undefined) => {
  const d = (v ?? "").replace(/\D/g, "");
  return d.startsWith("44") ? `0${d.slice(2)}` : d;
};
/** A Google profile link without the scheme, "www.", trailing slash or tracking. */
function profileKey(url: string | null | undefined): string {
  const v = lower(url);
  if (!v) return "";
  try {
    const u = new URL(/^https?:\/\//.test(v) ? v : `https://${v}`);
    const cid = u.searchParams.get("cid");
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}${cid ? `?cid=${cid}` : ""}`;
  } catch {
    return v;
  }
}
const domainOf = (email: string) => lower(email.split("@")[1]);
const companyNumberOf = (s: Specialist) =>
  (s.checks.find((c) => c.id === "registered_company" && !c.soleTrader)?.evidence ?? "").replace("Companies House no. ", "").trim().toUpperCase();

/** The identifiers we match businesses on, empty where not known. */
interface Identity {
  name: string;
  email: string;
  phone: string;
  companyNumber: string;
  profile: string;
  contactName: string;
}

function ofApplication(a: SupplierApplication): Identity {
  return {
    name: normaliseBusinessName(a.companyName),
    email: lower(a.email),
    phone: digits(a.phone),
    companyNumber: (a.companiesHouseNumber ?? "").trim().toUpperCase(),
    profile: profileKey(a.googleProfileUrl),
    contactName: lower(a.contactName),
  };
}

function ofSpecialist(s: Specialist): Identity {
  return {
    name: normaliseBusinessName(s.name),
    email: lower(s.enquiryEmail),
    phone: digits(s.onboarding?.phone),
    companyNumber: companyNumberOf(s),
    profile: profileKey(s.onboarding?.googleProfileUrl),
    contactName: lower(s.onboarding?.contactName),
  };
}

/** Which identifiers two businesses share, in words. */
function shared(a: Identity, b: Identity): string[] {
  const out: string[] = [];
  if (a.name && a.name === b.name) out.push("business name");
  if (a.email && a.email === b.email) out.push("email");
  if (a.phone && a.phone === b.phone) out.push("phone");
  if (a.companyNumber && a.companyNumber === b.companyNumber) out.push("Companies House number");
  if (a.profile && a.profile === b.profile) out.push("Google profile");
  return out;
}

export interface FlagResult {
  flag: ReferralFlag;
  /** What we found, for the owner. */
  detail: string;
}

/**
 * Every reason this referral might not qualify, for the chosen recommender
 * (or none chosen yet). Rules (a) to (d) in the Specialist terms:
 * (a) the recommender wasn't an approved specialist when the application was made;
 * (b) the applicant was already registered, had applied before, or had been recommended before;
 * (c) the applicant names itself, or shares an email, phone, Companies House number or likely owner with the recommender;
 * (d) the application arrived after the deadline.
 */
export function referralFlags(input: {
  application: SupplierApplication;
  recommender: Specialist | null;
  applications: SupplierApplication[];
  specialists: Specialist[];
}): FlagResult[] {
  const { application: a, recommender, applications, specialists } = input;
  const flags: FlagResult[] = [];
  const me = ofApplication(a);
  const at = a.recommendedBy?.submittedAt ?? a.createdAt;

  // (a)
  if (!recommender) flags.push({ flag: "recommender_not_approved", detail: "No approved specialist has been chosen as the recommender." });
  else if (!wasActiveAt(recommender, at))
    flags.push({
      flag: "recommender_not_approved",
      detail: `${recommender.name} wasn't an approved specialist with accepted terms when this application was made.`,
    });

  // (b) Earlier applications (any outcome) and any specialist record not created from this application.
  const earlierApps = applications.filter((x) => x.id !== a.id && x.createdAt < a.createdAt);
  for (const x of earlierApps) {
    const same = shared(me, ofApplication(x));
    if (same.length) flags.push({ flag: "not_new", detail: `Earlier application from ${x.companyName} (${ordinalDate(x.createdAt, true)}) has the same ${same.join(", ")}.` });
  }
  for (const s of specialists.filter((s) => !s.isDemo && s.onboarding?.applicationId !== a.id)) {
    const same = shared(me, ofSpecialist(s));
    if (same.length) flags.push({ flag: "not_new", detail: `Already registered as ${s.name} (same ${same.join(", ")}).` });
  }

  // (c)
  const typed = normaliseBusinessName(a.recommendedBy?.name ?? "");
  if (typed && typed === me.name) flags.push({ flag: "connected", detail: "The applicant named its own business." });
  if (recommender) {
    const them = ofSpecialist(recommender);
    const same = shared(me, them);
    if (same.length) flags.push({ flag: "connected", detail: `The applicant and ${recommender.name} share the same ${same.join(", ")}.` });
    const domain = domainOf(me.email);
    if (domain && domain === domainOf(them.email) && !FREE_EMAIL_DOMAINS.includes(domain))
      flags.push({ flag: "connected", detail: `Both use email addresses at ${domain}.` });
    if (me.contactName && me.contactName === them.contactName)
      flags.push({ flag: "connected", detail: `Both have the same contact name (${a.contactName}).` });
  }

  // (d)
  if (!referralsOpen(at)) flags.push({ flag: "late", detail: `Submitted ${ordinalDate(at, true)} at ${ukTime(at)}, after ${referrals.lastDay}.` });

  return flags;
}

/** Why a confirmation can't be saved, or null if it can. */
export function confirmationProblem(c: Pick<ReferralConfirmation, "flags" | "overrides" | "ownershipChecked">): string | null {
  const blocking = c.flags.filter((f) => blockingFlags.includes(f));
  if (blocking.length) return `This referral can't qualify: ${blocking.map((f) => flagLabels[f].toLowerCase()).join("; ")}.`;
  const missing = [...new Set(c.flags)].filter((f) => !c.overrides.some((o) => o.flag === f && o.reason.trim()));
  if (missing.length) return `Give a reason to override: ${missing.map((f) => flagLabels[f].toLowerCase()).join("; ")}.`;
  if (!c.ownershipChecked) return "Confirm you've checked Companies House (or the owner's details) and they don't share an owner or director.";
  return null;
}

function referralLine(supplierSlug: string, id: string, note: string, createdAt: string): LedgerEntry {
  return { id, supplierSlug, createdAt, kind: "referral_bonus", amountCredits: referrals.credits, paidPence: null, enquiryId: null, note };
}

export type AwardOutcome =
  | { status: "awarded"; award: ReferralAward }
  | { status: "already_awarded"; award: ReferralAward }
  | { status: "not_confirmed" }
  | { status: "waiting"; reason: string };

/**
 * Adds the referral credits for an application if everything is in place:
 * the owner has confirmed the recommender, and the recommended business is
 * approved and has accepted the terms. Safe to call any number of times; it
 * pays at most once. If the recommender has left by then, only the
 * recommended business is credited.
 */
export async function awardReferralIfDue(applicationId: string, now = new Date()): Promise<AwardOutcome> {
  const existing = await recordStore.getReferralAward(applicationId);
  if (existing) return { status: "already_awarded", award: existing };
  const confirmation = await recordStore.getReferralConfirmation(applicationId);
  if (!confirmation) return { status: "not_confirmed" };
  if (confirmationProblem(confirmation)) return { status: "waiting", reason: "The confirmation has unresolved flags." };

  const specialists = await recordStore.listSpecialists();
  const recommended = specialists.find((s) => s.onboarding?.applicationId === applicationId && s.onboarding.status !== "removed");
  if (!recommended) return { status: "waiting", reason: "The business hasn't been approved yet." };
  if (recommended.onboarding?.status !== "active") return { status: "waiting", reason: "The business hasn't accepted the Specialist terms yet." };
  const recommender = specialists.find((s) => s.slug === confirmation.recommenderSlug) ?? null;
  const recommenderStillActive = !!recommender && recommender.onboarding?.status === "active";

  const awardedAt = now.toISOString();
  const recommendedEntryId = crypto.randomUUID();
  const recommenderEntryId = recommenderStillActive ? crypto.randomUUID() : null;
  const ref = `application ${applicationId}`;
  const lines = [
    referralLine(
      recommended.slug,
      recommendedEntryId,
      `Referral credits: recommended by ${recommender?.name ?? confirmation.recommenderSlug} (${ref}${recommenderEntryId ? `; their line ${recommenderEntryId}` : "; they had left, so weren't credited"})`,
      awardedAt,
    ),
    ...(recommenderEntryId
      ? [referralLine(recommender!.slug, recommenderEntryId, `Referral credits: recommended ${recommended.name} (${ref}; their line ${recommendedEntryId})`, awardedAt)]
      : []),
  ];
  const award: ReferralAward = {
    applicationId,
    recommenderSlug: confirmation.recommenderSlug,
    recommendedSlug: recommended.slug,
    credits: referrals.credits,
    recommenderEntryId,
    recommendedEntryId,
    awardedAt,
  };
  if (!(await recordStore.claimReferralAward(award, lines))) {
    const again = await recordStore.getReferralAward(applicationId);
    return again ? { status: "already_awarded", award: again } : { status: "waiting", reason: "Please try again." };
  }
  await trySend(referralCreditsEmail(recommended, recommender?.name ?? "the specialist who recommended you", "recommended"));
  if (recommenderEntryId) await trySend(referralCreditsEmail(recommender!, recommended.name, "recommender"));
  return { status: "awarded", award };
}

/** The short confirmation each business gets. */
export function referralCreditsEmail(s: Specialist, otherName: string, role: "recommender" | "recommended"): Email {
  const why =
    role === "recommender"
      ? `Thank you for recommending us to ${otherName}. They've now joined ${site.name}`
      : `${otherName} recommended us to you, and you've now joined ${site.name}`;
  return {
    to: s.enquiryEmail,
    replyTo: site.supplierApplicationsEmail,
    subject: `${referrals.credits} referral credits added to your ${site.name} account`,
    text: `Hello ${s.onboarding?.contactName ?? s.name},

${why}, so we've added ${formatCredits(referrals.credits)} to your account as referral credits.

Referral credits are free credits: they're used before credits you've bought, have no cash value and can't be transferred. They're on top of any other offer. See "Referral credits" in the Specialist terms: ${site.url}/supplier-terms

${site.name}
`,
  };
}

/** Saves the owner's confirmation, then adds the credits if the business is already approved and live. */
export async function confirmReferral(input: {
  application: SupplierApplication;
  recommenderSlug: string;
  overrides: { flag: ReferralFlag; reason: string }[];
  ownershipChecked: boolean;
  role: AdminRole;
  now?: Date;
}): Promise<{ ok: false; error: string; flags?: FlagResult[] } | { ok: true; outcome: AwardOutcome; flags: FlagResult[] }> {
  const { application, recommenderSlug, role } = input;
  if (role !== "owner") return { ok: false, error: "Only the owner can confirm referrals." };
  if (!application.recommendedBy?.name) return { ok: false, error: "This application didn't name a recommender." };
  if (application.status === "declined") return { ok: false, error: "This application was declined, so it can't earn referral credits." };
  if (await recordStore.getReferralAward(application.id)) return { ok: false, error: "Referral credits have already been added for this application." };
  const [specialists, applications] = await Promise.all([recordStore.listSpecialists(), recordStore.listSupplierApplications()]);
  const recommender = specialists.find((s) => s.slug === recommenderSlug) ?? null;
  const flags = referralFlags({ application, recommender, applications, specialists });
  const overrides = input.overrides
    .filter((o) => flags.some((f) => f.flag === o.flag) && !blockingFlags.includes(o.flag))
    .map((o) => ({ flag: o.flag, reason: o.reason.trim().slice(0, 500) }));
  const confirmation: ReferralConfirmation = {
    applicationId: application.id,
    recommenderSlug,
    nameAsEntered: application.recommendedBy.name,
    flags: [...new Set(flags.map((f) => f.flag))],
    overrides,
    ownershipChecked: input.ownershipChecked,
    confirmedAt: (input.now ?? new Date()).toISOString(),
    confirmedBy: role,
  };
  const problem = confirmationProblem(confirmation);
  if (problem) return { ok: false, error: problem, flags };
  await recordStore.saveReferralConfirmation(confirmation);
  return { ok: true, outcome: await awardReferralIfDue(application.id, input.now), flags };
}
