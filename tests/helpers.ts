import type { Specialist, SupplierApplication } from "@/lib/types";

/** Clears the in-memory record store between tests (no D1 binding outside Cloudflare). */
export function resetMemory() {
  const g = globalThis as { __vnMemory?: Record<string, unknown> };
  if (!g.__vnMemory) return;
  for (const [k, v] of Object.entries(g.__vnMemory)) {
    if (v instanceof Map) v.clear();
    else if (Array.isArray(v)) v.length = 0;
    else delete g.__vnMemory[k];
  }
}

export function specialist(slug: string, overrides: Partial<Specialist> & { status?: "awaiting_terms" | "active" | "removed"; acceptedAt?: string; companyNumber?: string; applicationId?: string | null; phone?: string; contactName?: string; profile?: string } = {}): Specialist {
  const { status = "active", acceptedAt = "2026-11-01T10:00:00.000Z", companyNumber, applicationId = null, phone = "07700900001", contactName = "Pat Owner", profile = null, ...rest } = overrides;
  return {
    slug,
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Ltd",
    isDemo: false,
    enquiryEmail: `${slug}@${slug}.co.uk`,
    services: ["plumbing"],
    areasCovered: [],
    about: "",
    googleRating: 4.8,
    googleReviewCount: 20,
    checks: [
      companyNumber
        ? { id: "registered_company", passed: true, evidence: `Companies House no. ${companyNumber}` }
        : { id: "registered_company", passed: true, evidence: "Sole trader: identity and address checked", soleTrader: true },
    ],
    checksLastConfirmed: "2026-11-01",
    onboarding: {
      status,
      applicationId,
      contactName,
      phone,
      googleProfileUrl: profile ?? `https://g.page/${slug}`,
      checkNotes: { company: "", guarantee: "", scheme: "", google: "" },
      checkedBy: "owner",
      approvedAt: "2026-11-01T09:00:00.000Z",
      approvedBy: "owner",
      updatedAt: "2026-11-01T09:00:00.000Z",
      updatedBy: "owner",
      termsInvite: null,
      terms: status === "active" ? { version: "2026-11-19", wordingId: "x", wording: "x", acceptedByName: contactName, acceptedAt } : null,
    } as Specialist["onboarding"],
    ...rest,
  } as Specialist;
}

export function application(id: string, overrides: Partial<SupplierApplication> = {}): SupplierApplication {
  return {
    kind: "supplier_application",
    id,
    status: "received",
    companyName: "New Drains Ltd",
    contactName: "Sam New",
    email: "sam@newdrains.co.uk",
    phone: "07700900999",
    website: null,
    mainService: "plumbing",
    servicesOffered: ["plumbing"],
    areasCovered: [],
    otherAreas: null,
    businessType: "limited",
    companiesHouseNumber: "12345678",
    competentPersonScheme: "None",
    insuranceBackedGuaranteeProvider: "",
    googleProfileUrl: "https://g.page/new-drains",
    description: "Drains",
    anythingElse: null,
    recommendedBy: { name: "Best Plumbing Limited", submittedAt: "2026-12-01T12:00:00.000Z" },
    declaration: { wordingId: "x", wording: "x", givenAt: "2026-12-01T12:00:00.000Z" },
    source: { referrer: null, landingPath: null, utm: {} },
    createdAt: "2026-12-01T12:00:00.000Z",
    ...overrides,
  };
}
