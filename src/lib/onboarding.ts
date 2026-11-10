import { maxRadiusMiles } from "@/config/coverage";
import { getService } from "@/config/services";
import { launch } from "@/config/launch";
import { addCredit } from "@/lib/billing";
import { site } from "@/config/site";
import { specialistTermsVersion, specialistTermsWording, termsInviteDays } from "@/config/suppliers";
import { vettingStandard } from "@/config/vetting";
import { getFunnel } from "@/funnels";
import { bindings } from "@/lib/cloudflare";
import { lookupPostcode } from "@/lib/geo";
import { trySend, type Email } from "@/lib/notifications";
import { normalisePostcode, postcodeArea } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import { EMAIL, normaliseCompanyNumber, normalisePhone, normaliseUrl, requestOrigin, str } from "@/lib/request";
import { allSpecialists } from "@/lib/specialistDirectory";
import type { AdminRole, Specialist, SupplierApplication, VettingCheckResult } from "@/lib/types";

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
  companiesHouseNumber: string;
  companyCheck: string;
  guaranteeProvider: string;
  guaranteeCheck: string;
  scheme: { needed: true; name: string; registration: string; check: string } | { needed: false; reason: string };
  checksConfirmedOn: string;
}

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
  const companiesHouseNumber = normaliseCompanyNumber(String(b.companiesHouseNumber ?? ""));
  const companyCheck = str(b.companyCheck, 300) ?? "";
  const guaranteeProvider = str(b.guaranteeProvider, 160) ?? "";
  const guaranteeCheck = str(b.guaranteeCheck, 300) ?? "";
  const s = (typeof b.scheme === "object" && b.scheme !== null ? b.scheme : {}) as Record<string, unknown>;
  const schemeNeeded = s.needed !== false;
  const schemeName = str(s.name, 120) ?? "";
  const schemeRegistration = str(s.registration, 60) ?? "";
  const schemeCheck = str(s.check, 300) ?? "";
  const schemeReason = str(s.reason, 200) ?? "";
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
  if (!companiesHouseNumber) errors.companiesHouseNumber = "Enter an 8-character Companies House number, for example 01234567 or SC123456.";
  if (!companyCheck) errors.companyCheck = "Say what you checked, for example \"Active on Companies House, details match\".";
  if (!guaranteeProvider) errors.guaranteeProvider = "Enter who provides their insurance-backed guarantee.";
  if (!guaranteeCheck) errors.guaranteeCheck = "Say what you checked, for example \"Membership certificate seen, valid to 2027\".";
  if (schemeNeeded) {
    if (!schemeName) errors.schemeName = "Enter the scheme, for example Gas Safe Register.";
    if (!schemeCheck) errors.schemeCheck = "Say what you checked, for example \"Found on the Gas Safe register\".";
  } else if (!schemeReason) {
    errors.schemeReason = "Say why no scheme is needed, for example \"Building control approves the work\".";
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
      companiesHouseNumber: companiesHouseNumber!,
      companyCheck,
      guaranteeProvider,
      guaranteeCheck,
      scheme: schemeNeeded
        ? { needed: true, name: schemeName, registration: schemeRegistration, check: schemeCheck }
        : { needed: false, reason: schemeReason },
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

function checksFrom(d: SpecialistDraft): VettingCheckResult[] {
  return [
    { id: "registered_company", passed: true, evidence: `Companies House no. ${d.companiesHouseNumber}` },
    { id: "insurance_backed_guarantee", passed: true, evidence: `Provider: ${d.guaranteeProvider}` },
    d.scheme.needed
      ? {
          id: "competent_person_scheme",
          passed: true,
          evidence: `Scheme: ${d.scheme.name}${d.scheme.registration ? `, registration ${d.scheme.registration}` : ""}`,
        }
      : { id: "competent_person_scheme", passed: false, evidence: "", notApplicableReason: `Not applicable: ${d.scheme.reason}` },
    {
      id: "google_rating",
      passed: d.googleRating > vettingStandard.minimumGoogleRating,
      evidence: `${d.googleRating.toFixed(1)} from ${d.googleReviewCount} reviews`,
    },
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
  const taken = new Set((await allSpecialists()).map((s) => s.slug));
  const slug = existing?.slug ?? slugFor(d.companyName, taken);
  const checkNotes = {
    company: d.companyCheck,
    guarantee: d.guaranteeCheck,
    scheme: d.scheme.needed ? d.scheme.check : d.scheme.reason,
    google: `${d.googleRating.toFixed(1)} from ${d.googleReviewCount} reviews`,
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
      launch.onboardingPhase && launch.foundingCredits > 0
        ? `1. Accept the terms using the link above.
2. We'll add ${launch.foundingCredits} free founding credits to your account straight away. You don't need to top up yet.
3. We start advertising to homeowners in ${launch.advertisingFrom}. Until then introductions will be few, and any you receive are free.`
        : `1. Accept the terms using the link above.
2. Top up your credits. Reply to this email and we'll send you the payment details.
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
  const updated: Specialist = {
    ...s,
    onboarding: {
      ...s.onboarding!,
      status: "active",
      termsInvite: null,
      terms: { version: specialistTermsVersion, wordingId: expected.wordingId, wording: expected.wording, acceptedByName, acceptedAt },
    },
  };
  await recordStore.saveSpecialist(updated);
  // The founding offer: free credits for specialists who join before we start advertising.
  const founding = launch.onboardingPhase ? launch.foundingCredits : 0;
  if (founding > 0) await addCredit(s.slug, "promo", founding, "Founding specialist credits");
  await trySend(termsAcceptedEmail(updated, founding));
  await trySend(termsAcceptedAlertEmail(updated));
  return { ok: true, specialist: updated };
}

function termsAcceptedEmail(s: Specialist, foundingCredits: number): Email {
  const t = s.onboarding!.terms!;
  return {
    to: s.enquiryEmail,
    replyTo: site.supplierApplicationsEmail,
    subject: `You've accepted the ${site.name} Specialist terms`,
    text: `Hello ${s.onboarding!.contactName},

Thanks. This confirms that ${t.acceptedByName} accepted our Specialist terms for ${s.name} on ${new Date(t.acceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })}. You agreed:

"${t.wording}"

You can read the terms at any time at ${site.url}/supplier-terms. We'll give you notice before they change.

${
      foundingCredits > 0
        ? `As a founding specialist, we've added ${foundingCredits} free credits to your account. You don't need to top up yet.

We start advertising to homeowners in ${launch.advertisingFrom}, so please don't expect many introductions before then. Because the site is already live, you may still receive some. Those are free: they're recorded on your account but not charged, and they don't use your free credits. We'll email you at least 14 days before introductions start to be charged.`
        : "To start receiving introductions, top up your credits: reply to this email and we'll send you the payment details."
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
