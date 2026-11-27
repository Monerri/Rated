import { maxRadiusMiles } from "@/config/coverage";
import { getService } from "@/config/services";
import { freeCreditsFor, launch } from "@/config/launch";
import { addCredit } from "@/lib/billing";
import { newPaymentReference, paymentReference, topUpInstructions } from "@/lib/payments";
import { site } from "@/config/site";
import { specialistTermsVersion, specialistTermsWording, termsInviteDays } from "@/config/suppliers";
import { verifiedBadge, vettingStandard, soleTraderChecklist } from "@/config/vetting";
import { isVerified, missingForBadge } from "@/lib/vetting";
import { getFunnel } from "@/funnels";
import { bindings } from "@/lib/cloudflare";
import { lookupPostcode } from "@/lib/geo";
import { trySend, type Email } from "@/lib/notifications";
import { normalisePostcode, postcodeArea } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import { EMAIL, normaliseCompanyNumber, normalisePhone, normaliseUrl, requestOrigin, str } from "@/lib/request";
import { allSpecialists } from "@/lib/specialistDirectory";
import type { AdminRole, Specialist, SupplierApplication, TermsAcceptance, VettingCheckResult } from "@/lib/types";

/**
 * Approving specialists on /admin, and their acceptance of the Specialist
 * terms. An approved specialist is stored in the database "awaiting terms"
 * and sent a link; once they accept, they're active and can receive leads
 * (as long as they're vetted, switched on and have credit). Server only.
 */

/** What the admin form sends: the specialist's details and the evidence for each check. */
export interface SpecialistDraft {
  companyName: string;
  contactName: string;
  enquiryEmail: string;
  phone: string;
  googleProfileUrl: string | null;
  services: string[];
  leadTypes: Record<string, string[]>;
  skipLaterLeadsFor: string[];
  basePostcode: string;
  radiusMiles: number;
  excluded: string[];
  about: string;
  googleRating: number;
  googleReviewCount: number;
  /** Limited company (Companies House) or sole trader (identity and address checked instead). */
  business: { type: "limited"; companiesHouseNumber: string; check: string } | { type: "sole_trader"; check: string; checklist: string[] };
  /** Gas Safe or F gas, if their work legally needs it. Required to be recommended. */
  legal: { needed: false } | { needed: true; scheme: string; registration: string; check: string };
  /** For the badge. Sole traders are covered by the identity and address check. */
  identity: { status: "passed"; check: string } | { status: "not_passed" };
  guarantee: OptionalCheck<{ provider: string }>;
  scheme: OptionalCheck<{ name: string; registration: string }>;
  checksConfirmedOn: string;
}

/** A check needed only for the Verified badge: passed (with details), not passed, or not required (with a reason). */
type OptionalCheck<T> = ({ status: "passed"; check: string } & T) | { status: "not_passed" } | { status: "not_required"; reason: string };

export type Errors = Record<string, string>;

const AREA_OR_DISTRICT = /^[A-Z]{1,2}(\d[A-Z\d]?)?$/;

/** Checks the form and tidies it. Errors are keyed by field name so the form can show them in place. */
export function parseDraft(body: Record<string, unknown> | null): { ok: true; draft: SpecialistDraft } | { ok: false; errors: Errors } {
  const b = body ?? {};
  const errors: Errors = {};
  const companyName = str(b.companyName, 120) ?? "";
  const contactName = str(b.contactName, 120) ?? "";
  const enquiryEmail = (str(b.enquiryEmail, 254) ?? "").toLowerCase();
  const phone = normalisePhone(String(b.phone ?? ""));
  const googleProfileUrl = typeof b.googleProfileUrl === "string" && b.googleProfileUrl.trim() ? normaliseUrl(b.googleProfileUrl) : null;
  const services = Array.isArray(b.services) ? [...new Set(b.services.map(String))].filter((slug) => getService(slug)) : [];
  const rawTypes = (typeof b.leadTypes === "object" && b.leadTypes !== null ? b.leadTypes : {}) as Record<string, unknown>;
  const leadTypes: Record<string, string[]> = {};
  for (const slug of services) {
    const kinds = getFunnel(slug)?.leadTypes?.options.map((o) => o.value);
    if (!kinds) continue;
    const chosen = Array.isArray(rawTypes[slug]) ? (rawTypes[slug] as unknown[]).map(String).filter((k) => kinds.includes(k)) : kinds;
    if (chosen.length === 0) errors.services = `Choose at least one kind of ${getService(slug)!.name.toLowerCase()} work they take.`;
    // Taking every kind is stored as no preference, so new kinds added later reach them too.
    if (chosen.length < kinds.length) leadTypes[slug] = [...new Set(chosen)];
  }
  const skipLaterLeadsFor = Array.isArray(b.skipLaterLeadsFor) ? b.skipLaterLeadsFor.map(String).filter((s) => services.includes(s)) : [];
  const basePostcode = normalisePostcode(String(b.basePostcode ?? ""));
  const radiusMiles = Math.round(Number(b.radiusMiles));
  const excluded = String(b.excluded ?? "")
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter(Boolean);
  const about = str(b.about, 600) ?? "";
  const googleRating = Math.round(Number(b.googleRating) * 10) / 10;
  const googleReviewCount = Math.round(Number(b.googleReviewCount));
  const obj = (v: unknown) => (typeof v === "object" && v !== null ? v : {}) as Record<string, unknown>;
  const bz = obj(b.business);
  const soleTrader = bz.type === "sole_trader";
  const companiesHouseNumber = normaliseCompanyNumber(String(bz.companiesHouseNumber ?? ""));
  const businessCheck = str(bz.check, 300) ?? "";
  const ticked = Array.isArray(bz.checklist) ? bz.checklist.filter((x): x is string => typeof x === "string") : [];
  const checklist = soleTraderChecklist.filter((c) => ticked.includes(c.id)).map((c) => c.id);
  const lg = obj(b.legal);
  const legalNeeded = lg.needed === true;
  const legalScheme = str(lg.scheme, 120) ?? "";
  const legalRegistration = str(lg.registration, 60) ?? "";
  const legalCheck = str(lg.check, 300) ?? "";
  const id = obj(b.identity);
  const identityCheck = str(id.check, 300) ?? "";
  const identityPassed = soleTrader || id.status === "passed";
  const optional = (v: Record<string, unknown>) => ({
    status: v.status === "passed" || v.status === "not_required" ? v.status : "not_passed",
    check: str(v.check, 300) ?? "",
    reason: str(v.reason, 200) ?? "",
  });
  const g = obj(b.guarantee);
  const guarantee = optional(g);
  const guaranteeProvider = str(g.provider, 160) ?? "";
  const sc = obj(b.scheme);
  const scheme = optional(sc);
  const schemeName = str(sc.name, 120) ?? "";
  const schemeRegistration = str(sc.registration, 60) ?? "";
  const checksConfirmedOn = String(b.checksConfirmedOn ?? "");
  const confirmedDate = new Date(`${checksConfirmedOn}T00:00:00Z`);

  if (!companyName) errors.companyName = "Enter the company name.";
  if (!contactName) errors.contactName = "Enter a contact name.";
  if (!EMAIL.test(enquiryEmail)) errors.enquiryEmail = "Enter the email address leads should go to.";
  if (!phone) errors.phone = "Enter a UK phone number.";
  if (typeof b.googleProfileUrl === "string" && b.googleProfileUrl.trim() && !googleProfileUrl) errors.googleProfileUrl = "Enter a valid web address, or leave it blank.";
  if (services.length === 0) errors.services = "Choose at least one service.";
  if (!basePostcode) errors.basePostcode = "Enter their base as a full postcode, for example DH1 3AA.";
  if (!(radiusMiles >= 1 && radiusMiles <= maxRadiusMiles)) errors.radiusMiles = `Enter a distance from 1 to ${maxRadiusMiles} miles.`;
  if (!excluded.every((x) => AREA_OR_DISTRICT.test(x))) errors.excluded = "List postcode areas or districts only, separated by commas, for example TD, DG, NE71.";
  if (!about) errors.about = "Write a sentence or two about the business. Homeowners see this.";
  if (!(googleRating > 0 && googleRating <= 5)) errors.googleRating = "Enter their Google rating, for example 4.7.";
  else if (!(googleRating > vettingStandard.minimumGoogleRating)) errors.googleRating = `Their rating must be above ${vettingStandard.minimumGoogleRating} to pass our checks.`;
  if (!(googleReviewCount >= 1)) errors.googleReviewCount = "Enter how many Google reviews they have.";
  else if (googleReviewCount < vettingStandard.minimumGoogleReviews)
    errors.googleReviewCount = `They need at least ${vettingStandard.minimumGoogleReviews} reviews to pass our checks.`;
  if (!soleTrader && !companiesHouseNumber) errors.companiesHouseNumber = "Enter an 8-character Companies House number, for example 01234567 or SC123456.";
  if (soleTrader && soleTraderChecklist.some((c) => c.required && !checklist.includes(c.id)))
    errors.soleTraderChecklist = "Tick every required item. If you can't, the sole trader hasn't passed this check yet.";
  if (!businessCheck)
    errors.businessCheck = soleTrader
      ? "Say what you checked, for example \"Driving licence and council tax bill seen, names and address match\"."
      : "Say what you checked, for example \"Active on Companies House, details match\".";
  if (legalNeeded) {
    if (!legalScheme) errors.legalScheme = "Enter the registration, for example Gas Safe Register.";
    if (!legalCheck) errors.legalCheck = "Say what you checked, for example \"Found on the Gas Safe register\".";
  }
  if (!soleTrader && id.status === "passed" && !identityCheck) errors.identityCheck = "Say what you checked, for example \"Sam Fitter is a listed director\".";
  if (guarantee.status === "passed") {
    if (!guaranteeProvider) errors.guaranteeProvider = "Enter who provides their insurance-backed guarantee.";
    if (!guarantee.check) errors.guaranteeCheck = "Say what you checked, for example \"Membership certificate seen, valid to 2027\".";
  } else if (guarantee.status === "not_required" && !guarantee.reason) {
    errors.guaranteeReason = "Say why it isn't needed, for example \"Design work only\". Homeowners see this.";
  }
  if (scheme.status === "passed") {
    if (!schemeName) errors.schemeName = "Enter the scheme, for example NICEIC.";
    if (!scheme.check) errors.schemeCheck = "Say what you checked, for example \"Found on the NICEIC register\".";
  } else if (scheme.status === "not_required" && !scheme.reason) {
    errors.schemeReason = "Say why no scheme is needed, for example \"Building control approves the work\". Homeowners see this.";
  }
  if (Number.isNaN(confirmedDate.getTime()) || confirmedDate > new Date()) errors.checksConfirmedOn = "Enter the date you did the checks.";
  if (b.checkerConfirmed !== true) errors.checkerConfirmed = "Please confirm you've checked each item.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    draft: {
      companyName,
      contactName,
      enquiryEmail,
      phone: phone!,
      googleProfileUrl,
      services,
      leadTypes,
      skipLaterLeadsFor,
      basePostcode: basePostcode!,
      radiusMiles,
      excluded,
      about,
      googleRating,
      googleReviewCount,
      business: soleTrader
        ? { type: "sole_trader", check: businessCheck, checklist }
        : { type: "limited", companiesHouseNumber: companiesHouseNumber!, check: businessCheck },
      legal: legalNeeded ? { needed: true, scheme: legalScheme, registration: legalRegistration, check: legalCheck } : { needed: false },
      identity: identityPassed ? { status: "passed", check: soleTrader ? "Covered by the identity and address check" : identityCheck } : { status: "not_passed" },
      guarantee:
        guarantee.status === "passed"
          ? { status: "passed", provider: guaranteeProvider, check: guarantee.check }
          : guarantee.status === "not_required"
            ? { status: "not_required", reason: guarantee.reason }
            : { status: "not_passed" },
      scheme:
        scheme.status === "passed"
          ? { status: "passed", name: schemeName, registration: schemeRegistration, check: scheme.check }
          : scheme.status === "not_required"
            ? { status: "not_required", reason: scheme.reason }
            : { status: "not_passed" },
      checksConfirmedOn,
    },
  };
}

function slugFor(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/\b(ltd|limited)\b\.?/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "specialist";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

const notApplicable = (id: VettingCheckResult["id"], reason: string): VettingCheckResult => ({
  id,
  passed: false,
  evidence: "",
  notApplicableReason: `Not applicable: ${reason}`,
});
const notPassed = (id: VettingCheckResult["id"]): VettingCheckResult => ({ id, passed: false, evidence: "" });

/** The public results of each check. "What you checked" notes stay in onboarding.checkNotes. */
function checksFrom(d: SpecialistDraft): VettingCheckResult[] {
  return [
    d.business.type === "limited"
      ? { id: "registered_company", passed: true, evidence: `Companies House no. ${d.business.companiesHouseNumber}` }
      : { id: "registered_company", passed: true, evidence: "Sole trader: identity and address checked", soleTrader: true },
    d.legal.needed
      ? { id: "legal_registration", passed: true, evidence: `${d.legal.scheme}${d.legal.registration ? `, registration ${d.legal.registration}` : ""}` }
      : notApplicable("legal_registration", "no gas or refrigerant work"),
    {
      id: "google_rating",
      passed: d.googleRating > vettingStandard.minimumGoogleRating && d.googleReviewCount >= vettingStandard.minimumGoogleReviews,
      evidence: `${d.googleRating.toFixed(1)} from ${d.googleReviewCount} reviews`,
    },
    d.identity.status === "passed"
      ? { id: "identity", passed: true, evidence: d.business.type === "sole_trader" ? "Owner's identity checked" : "Contact is a listed director" }
      : notPassed("identity"),
    d.guarantee.status === "passed"
      ? { id: "insurance_backed_guarantee", passed: true, evidence: `Provider: ${d.guarantee.provider}` }
      : d.guarantee.status === "not_required"
        ? notApplicable("insurance_backed_guarantee", d.guarantee.reason)
        : notPassed("insurance_backed_guarantee"),
    d.scheme.status === "passed"
      ? {
          id: "competent_person_scheme",
          passed: true,
          evidence: `Scheme: ${d.scheme.name}${d.scheme.registration ? `, registration ${d.scheme.registration}` : ""}`,
        }
      : d.scheme.status === "not_required"
        ? notApplicable("competent_person_scheme", d.scheme.reason)
        : notPassed("competent_person_scheme"),
  ];
}

/**
 * Builds the specialist record from the form. For a new specialist, also
 * creates the terms link. For an edit, keeps their onboarding history.
 */
export async function buildSpecialist(
  d: SpecialistDraft,
  role: AdminRole,
  existing: Specialist | null,
  applicationId: string | null,
): Promise<{ ok: true; specialist: Specialist } | { ok: false; errors: Errors }> {
  const place = await lookupPostcode(d.basePostcode);
  if (place === null) return { ok: false, errors: { basePostcode: "That postcode doesn't exist. Please check it." } };
  if (place === undefined) return { ok: false, errors: { basePostcode: "We couldn't look that postcode up just now. Please try again in a minute." } };

  const now = new Date().toISOString();
  const everyone = await allSpecialists();
  const taken = new Set(everyone.map((s) => s.slug));
  const slug = existing?.slug ?? slugFor(d.companyName, taken);
  const reference = existing ? paymentReference(existing) : newPaymentReference(slug, everyone.map(paymentReference));
  const checkNotes = {
    company: d.business.check,
    legal: d.legal.needed ? d.legal.check : "Not needed: no gas or refrigerant work",
    identity: d.identity.status === "passed" ? d.identity.check : "Not checked",
    guarantee: d.guarantee.status === "passed" ? d.guarantee.check : d.guarantee.status === "not_required" ? d.guarantee.reason : "Not checked",
    scheme: d.scheme.status === "passed" ? d.scheme.check : d.scheme.status === "not_required" ? d.scheme.reason : "Not checked",
    google: `${d.googleRating.toFixed(1)} from ${d.googleReviewCount} reviews`,
    ...(d.business.type === "sole_trader" ? { soleTraderChecklist: d.business.checklist } : {}),
  };
  const specialist: Specialist = {
    slug,
    name: d.companyName,
    isDemo: false,
    enquiryEmail: d.enquiryEmail,
    services: d.services,
    areasCovered: [postcodeArea(place.postcode)],
    coverage: {
      basePostcode: place.postcode,
      lat: place.lat,
      lng: place.lng,
      radiusMiles: d.radiusMiles,
      ...(d.excluded.length ? { excluded: d.excluded } : {}),
    },
    about: d.about,
    googleRating: d.googleRating,
    googleReviewCount: d.googleReviewCount,
    checks: checksFrom(d),
    checksLastConfirmed: d.checksConfirmedOn,
    ...(d.skipLaterLeadsFor.length ? { skipLaterLeadsFor: d.skipLaterLeadsFor } : {}),
    ...(Object.keys(d.leadTypes).length ? { leadTypes: d.leadTypes } : {}),
    onboarding: existing?.onboarding
      ? {
          ...existing.onboarding,
          contactName: d.contactName,
          phone: d.phone,
          googleProfileUrl: d.googleProfileUrl,
          checkNotes,
          checkedBy: role,
          paymentReference: reference,
          updatedAt: now,
          updatedBy: role,
        }
      : {
          status: "awaiting_terms",
          applicationId,
          contactName: d.contactName,
          phone: d.phone,
          googleProfileUrl: d.googleProfileUrl,
          checkNotes,
          checkedBy: role,
          paymentReference: reference,
          approvedAt: now,
          approvedBy: role,
          updatedAt: now,
          updatedBy: role,
          termsInvite: null,
          terms: null,
        },
  };
  return { ok: true, specialist };
}

/** The address used in links we email, so links point at the main domain once it's connected. */
export function linkOrigin(request: Request): string {
  const { LINK_ORIGIN, SITE_URL } = bindings();
  return LINK_ORIGIN ?? SITE_URL ?? requestOrigin(request);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/** Creates a fresh terms link (any earlier one stops working), saves it, and emails it. */
export async function sendTermsInvite(s: Specialist, role: AdminRole, origin: string): Promise<{ sent: boolean; specialist: Specialist }> {
  if (!s.onboarding) throw new Error("Only specialists approved on /admin are sent the terms.");
  const sentAt = new Date().toISOString();
  const invite = { token: crypto.randomUUID(), sentAt, expiresAt: addDays(sentAt, termsInviteDays), sentBy: role };
  const updated: Specialist = { ...s, onboarding: { ...s.onboarding, termsInvite: invite } };
  await recordStore.saveSpecialist(updated);
  const sent = await trySend(termsInviteEmail(updated, `${origin}/specialist-terms/accept/${invite.token}`));
  return { sent, specialist: updated };
}

function serviceList(s: Specialist): string {
  return s.services.map((slug) => getService(slug)?.name ?? slug).join(", ");
}

function termsInviteEmail(s: Specialist, link: string): Email {
  return {
    to: s.enquiryEmail,
    replyTo: site.supplierApplicationsEmail,
    subject: `Welcome to ${site.name}: please accept our Specialist terms`,
    text: `Hello ${s.onboarding!.contactName},

Good news: ${s.name} has passed our checks for ${serviceList(s)}.

Before we can send you any introductions, please read and accept our Specialist terms. They explain how introductions, prepaid credits, bonus credits and refunds work. It takes a minute:

${link}

The link works for ${termsInviteDays} days. If it runs out, reply to this email and we'll send a new one.

What happens next
${
      launch.onboardingPhase && launch.welcomeCredits + launch.foundingCredits > 0
        ? `1. Accept the terms using the link above.
2. We'll add your free credits to your account straight away. You don't need to top up yet.
3. We start advertising to homeowners in ${launch.advertisingFrom}. Until then introductions will be few, and any you receive are free.`
        : `1. Accept the terms using the link above.
2. Top up your credits by bank transfer. We'll send you our bank details and your own payment reference once you've accepted.
3. Once your credits arrive, you'll start receiving introductions from homeowners in your area who ask to hear from a specialist.`
    }

You'll need to contact homeowners ${site.specialistResponseTime} of each introduction.

${site.name}
`,
  };
}

/** Finds the specialist a terms link belongs to, if the link is still valid. */
export async function specialistForTermsToken(token: string): Promise<{ specialist: Specialist; expired: boolean } | null> {
  if (!/^[0-9a-f-]{36}$/.test(token)) return null;
  const s = (await recordStore.listSpecialists()).find((x) => x.onboarding?.termsInvite?.token === token);
  if (!s) return null;
  return { specialist: s, expired: new Date(s.onboarding!.termsInvite!.expiresAt) < new Date() };
}

/** Records a specialist's acceptance of the terms, word for word, and makes them active. */
export async function acceptTerms(
  token: string,
  acceptedByName: string,
  consent: { wordingId: string; wording: string; given: boolean },
): Promise<{ ok: true; specialist: Specialist } | { ok: false; status: number; error: string }> {
  const found = await specialistForTermsToken(token);
  if (!found) return { ok: false, status: 404, error: "This link isn't valid. Please use the latest link we emailed you." };
  if (found.expired) return { ok: false, status: 410, error: "This link has expired. Reply to our email and we'll send a new one." };
  const s = found.specialist;
  const expected = specialistTermsWording(s.name);
  if (!consent.given || consent.wordingId !== expected.wordingId || consent.wording !== expected.wording) {
    return { ok: false, status: 400, error: "Please tick the box to accept the terms." };
  }
  if (!acceptedByName) return { ok: false, status: 400, error: "Please enter your full name." };

  const acceptedAt = new Date().toISOString();
  const terms = { version: specialistTermsVersion, wordingId: expected.wordingId, wording: expected.wording, acceptedByName, acceptedAt };
  const { specialist: updated } = await activateSpecialist(s, terms, false);
  await trySend(termsAcceptedAlertEmail(updated));
  return { ok: true, specialist: updated };
}

/**
 * Makes a specialist active with their terms acceptance: either from the
 * emailed link, or (`onApproval`) the acceptance they gave on their
 * application, in which case this is their welcome email. Adds their free
 * credits: welcome credits, plus Founding Supplier credits if they applied
 * before the deadline (or, without an application, were approved before it).
 */
export async function activateSpecialist(
  s: Specialist,
  terms: TermsAcceptance,
  onApproval: boolean,
): Promise<{ specialist: Specialist; emailed: boolean }> {
  const updated: Specialist = { ...s, onboarding: { ...s.onboarding!, status: "active", termsInvite: null, terms } };
  await recordStore.saveSpecialist(updated);
  const application = s.onboarding?.applicationId ? await recordStore.getSupplierApplication(s.onboarding.applicationId) : null;
  const free = freeCreditsFor(application?.createdAt ?? s.onboarding!.approvedAt);
  if (free.welcome > 0) await addCredit(s.slug, "promo", free.welcome, "Welcome credits");
  if (free.founding > 0) await addCredit(s.slug, "promo", free.founding, "Founding Supplier credits");
  const emailed = await trySend(termsAcceptedEmail(updated, free, onApproval));
  return { specialist: updated, emailed };
}

/** Whether an application's terms acceptance is for the current version, so approving it can make them active straight away. */
export function currentTermsFromApplication(a: SupplierApplication | null): TermsAcceptance | null {
  return a?.termsAcceptance?.version === specialistTermsVersion ? a.termsAcceptance : null;
}

function termsAcceptedEmail(s: Specialist, free: { welcome: number; founding: number }, onApproval: boolean): Email {
  const total = free.welcome + free.founding;
  const t = s.onboarding!.terms!;
  return {
    to: s.enquiryEmail,
    replyTo: site.supplierApplicationsEmail,
    subject: onApproval ? `You're approved: welcome to ${site.name}` : `You've accepted the ${site.name} Specialist terms`,
    text: `Hello ${s.onboarding!.contactName},

${onApproval ? `Good news: ${s.name} has passed our checks for ${serviceList(s)}, and you're now set up to receive introductions.

When you applied, ${t.acceptedByName} accepted our Specialist terms for ${s.name}, and they now apply. That was on ` : `Thanks. This confirms that ${t.acceptedByName} accepted our Specialist terms for ${s.name} on `}${new Date(t.acceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })}. You agreed:

"${t.wording}"

You can read the terms at any time at ${site.url}/supplier-terms. We'll give you notice before they change.

${badgeLine(s)}

${
      total > 0
        ? `${
            free.founding > 0
              ? `As a Founding Supplier, you get ${free.welcome} welcome credits plus ${free.founding} Founding Supplier credits: ${total} free credits in all, now on your account.`
              : `We've added ${total} free welcome credits to your account.`
          } You don't need to top up yet. Free credits are used before any you buy, and they have no cash value.
${
  launch.onboardingPhase
    ? `
We start advertising to homeowners in ${launch.advertisingFrom}, so please don't expect many introductions before then. Because the site is already live, you may still receive some. Those are free: they're recorded on your account but not charged, and they don't use your free credits. We'll email you at least 14 days before introductions start to be charged.
`
    : ""
}
When you'd like to add more credits, here's how:

${topUpInstructions(s)}`
        : `To start receiving introductions, top up your credits.

${topUpInstructions(s)}`
    }

${site.name}
`,
  };
}

function termsAcceptedAlertEmail(s: Specialist): Email {
  return {
    to: site.supplierApplicationsEmail,
    subject: `Terms accepted: ${s.name}`,
    text: `${s.onboarding!.terms!.acceptedByName} accepted the Specialist terms (version ${s.onboarding!.terms!.version}) for ${s.name}.

They're now active. They'll start receiving introductions once their first top-up is recorded on /admin.
`,
  };
}

/** Marks an application as approved or declined. */
export async function recordReview(
  a: SupplierApplication,
  role: AdminRole,
  outcome: { approvedAs: string } | { declined: string | null },
): Promise<void> {
  await recordStore.saveSupplierApplication({
    ...a,
    status: "approvedAs" in outcome ? "accepted" : "declined",
    review: {
      at: new Date().toISOString(),
      by: role,
      specialistSlug: "approvedAs" in outcome ? outcome.approvedAs : null,
      declineReason: "declined" in outcome ? outcome.declined : null,
    },
  });
}

/** Sent when an application is declined. The message is what the admin chose to say, if anything. */
export function applicationDeclinedEmail(a: SupplierApplication, message: string | null): Email {
  return {
    to: a.email,
    replyTo: site.supplierApplicationsEmail,
    subject: `Your application to ${site.name}: ${a.companyName}`,
    text: `Hello ${a.contactName},

Thank you for applying to receive introductions from ${site.name}. We've reviewed your application, and we're not able to accept it at the moment.
${message ? `\n${message}\n` : ""}
You're welcome to apply again if anything changes.

Reference: ${a.id}

${site.name}
`,
  };
}

/**
 * Removes a specialist: they're no longer listed, matched or sent statements,
 * but their record and account history are kept, as the privacy notice says.
 * Only possible once their balance is zero, so unused credits are paid out or
 * forfeited first under the Specialist terms.
 */
export async function removeSpecialist(
  slug: string,
  role: AdminRole,
  reason: string,
  notify: boolean,
): Promise<{ ok: true; emailed: boolean } | { ok: false; status: number; error: string }> {
  const s = (await recordStore.listSpecialists()).find((x) => x.slug === slug);
  if (!s?.onboarding) return { ok: false, status: 404, error: "Specialist not found." };
  if (s.onboarding.status === "removed") return { ok: false, status: 400, error: "They've already been removed." };
  const balance = (await recordStore.getBalances())[slug] ?? 0;
  if (balance !== 0) {
    return {
      ok: false,
      status: 400,
      error: `They still have ${balance} credits. In Accounts and top-ups, pay out their unused credits (or forfeit them if they left over 6 months ago) before removing them.`,
    };
  }
  const now = new Date().toISOString();
  await recordStore.saveSpecialist({
    ...s,
    onboarding: {
      ...s.onboarding,
      status: "removed",
      termsInvite: null,
      removal: { at: now, by: role, reason, previousStatus: s.onboarding.status },
      updatedAt: now,
      updatedBy: role,
    },
  });
  const emailed = notify ? await trySend(removedEmail(s)) : false;
  return { ok: true, emailed };
}

/** Puts a removed specialist back as they were. They're matched again only if they'd accepted the terms. */
export async function restoreSpecialist(slug: string, role: AdminRole): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const s = (await recordStore.listSpecialists()).find((x) => x.slug === slug);
  if (!s?.onboarding || s.onboarding.status !== "removed") return { ok: false, status: 404, error: "Removed specialist not found." };
  const now = new Date().toISOString();
  await recordStore.saveSpecialist({
    ...s,
    onboarding: { ...s.onboarding, status: s.onboarding.removal?.previousStatus ?? "awaiting_terms", removal: null, updatedAt: now, updatedBy: role },
  });
  return { ok: true };
}

function removedEmail(s: Specialist): Email {
  return {
    to: s.enquiryEmail,
    replyTo: site.supplierApplicationsEmail,
    subject: `${site.name}: we've stopped sending you introductions`,
    text: `Hello ${s.onboarding?.contactName ?? s.name},

We're writing to let you know that we've stopped sending introductions to ${s.name}, and your account with us is now closed.

If you have any questions, please reply to this email.

${site.name}
`,
  };
}

/** For the welcome email: their badge, or exactly what they need for it. */
function badgeLine(s: Specialist): string {
  if (isVerified(s)) return `Your checks: you've passed every one, so homeowners will see the ${verifiedBadge.name} badge when we introduce you.`;
  return `Your checks: you've passed our required checks, so we can recommend you. To show the ${verifiedBadge.name} badge as well, you'll also need: ${missingForBadge(s).join(", ").toLowerCase()}. Reply to this email when you do, and we'll update your checks.`;
}
