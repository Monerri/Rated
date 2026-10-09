import { primaryRegion } from "@/config/regions";
import { getService, services } from "@/config/services";
import { competentPersonSchemes, supplierDeclarationWording } from "@/config/suppliers";
import { supplierAcknowledgementEmail, supplierApplicationInternalEmail, trySend } from "@/lib/notifications";
import { recordStore } from "@/lib/records";
import {
  EMAIL,
  jsonError,
  normaliseCompanyNumber,
  normalisePhone,
  normaliseUrl,
  parseSource,
  readJson,
  str,
} from "@/lib/request";
import type { SupplierApplication } from "@/lib/types";

const OTHER_SERVICE = "other";

/**
 * A business asking to be considered. Stored for review and acknowledged by
 * email. Nothing here approves a supplier or makes them matchable.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("We couldn't read that request.");

  // Honeypot: real people never see or fill this field.
  if (str(body.website_confirm, 200)) return new Response(null, { status: 201 });

  const errors: Record<string, string> = {};
  const companyName = str(body.companyName, 160);
  const contactName = str(body.contactName, 120);
  const email = str(body.email, 254);
  const phone = typeof body.phone === "string" ? normalisePhone(body.phone) : null;
  const websiteRaw = str(body.website, 300);
  const website = websiteRaw ? normaliseUrl(websiteRaw) : null;
  const mainService = String(body.mainService ?? "");
  const areasCovered = Array.isArray(body.areasCovered)
    ? body.areasCovered.map(String).filter((a) => primaryRegion.postcodeAreas.some((x) => x.code === a))
    : [];
  const otherAreas = str(body.otherAreas, 300);
  const companiesHouseNumber = typeof body.companiesHouseNumber === "string" ? normaliseCompanyNumber(body.companiesHouseNumber) : null;
  const scheme = competentPersonSchemes.find((s) => s.value === body.competentPersonScheme);
  const schemeOther = str(body.competentPersonSchemeOther, 120);
  const ibgProvider = str(body.insuranceBackedGuaranteeProvider, 160);
  const googleProfileUrl = typeof body.googleProfileUrl === "string" ? normaliseUrl(body.googleProfileUrl) : null;
  const description = str(body.description, 2000);
  const anythingElse = str(body.anythingElse, 2000);

  if (!companyName) errors.companyName = "Please enter your company name.";
  if (!contactName) errors.contactName = "Please enter a contact name.";
  if (!email || !EMAIL.test(email)) errors.email = "Please enter a valid email address.";
  if (!phone) errors.phone = "Please enter a UK phone number.";
  if (websiteRaw && !website) errors.website = "Please enter a valid web address, or leave this blank.";
  if (mainService !== OTHER_SERVICE && !services.some((s) => s.slug === mainService)) errors.mainService = "Please choose your main service.";
  if (areasCovered.length === 0 && !otherAreas) errors.areasCovered = "Please tell us which areas you cover.";
  if (!companiesHouseNumber) errors.companiesHouseNumber = "Please enter an 8-character Companies House number, for example 01234567 or SC123456.";
  if (!scheme) errors.competentPersonScheme = "Please choose an option.";
  if (scheme?.value === "other" && !schemeOther) errors.competentPersonSchemeOther = "Please tell us which scheme.";
  if (!ibgProvider) errors.insuranceBackedGuaranteeProvider = "Please tell us who provides your insurance-backed guarantee.";
  if (!googleProfileUrl) errors.googleProfileUrl = "Please enter a link to your Google Business profile or reviews.";
  if (!description) errors.description = "Please tell us a little about your business.";

  const expected = supplierDeclarationWording();
  const declaration = (body.declaration ?? {}) as Record<string, unknown>;
  if (declaration.given !== true || declaration.wordingId !== expected.wordingId || declaration.wording !== expected.wording) {
    errors.declaration = "Please confirm the declaration.";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "Please check the highlighted fields.", fields: errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const application: SupplierApplication = {
    kind: "supplier_application",
    id: crypto.randomUUID(),
    status: "received",
    companyName: companyName!,
    contactName: contactName!,
    email: email!,
    phone: phone!,
    website,
    mainService,
    areasCovered,
    otherAreas,
    companiesHouseNumber: companiesHouseNumber!,
    competentPersonScheme: scheme!.value === "other" ? `Other: ${schemeOther}` : scheme!.label,
    insuranceBackedGuaranteeProvider: ibgProvider!,
    googleProfileUrl: googleProfileUrl!,
    description: description!,
    anythingElse,
    declaration: { ...expected, givenAt: now },
    source: parseSource(body.source),
    createdAt: now,
  };

  await recordStore.saveSupplierApplication(application);
  const serviceName = mainService === OTHER_SERVICE ? "Other" : (getService(mainService)?.name ?? mainService);
  // The application is saved either way, so a failed email is logged rather than shown as an error.
  await trySend(supplierAcknowledgementEmail(application));
  await trySend(supplierApplicationInternalEmail(application, serviceName));

  return Response.json({ reference: application.id }, { status: 201 });
}
