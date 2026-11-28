import { test, beforeEach, before, after } from "node:test";
import assert from "node:assert/strict";
import { POST } from "@/app/api/supplier-applications/route";
import { applicationTermsWording, supplierDeclarationWording } from "@/config/suppliers";
import { recordStore } from "@/lib/records";
import { resetMemory } from "./helpers";

// No network in tests: postcode and email lookups that can't be reached are accepted (as on the live site).
const realFetch = globalThis.fetch;
before(() => {
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
});
beforeEach(resetMemory);

function body(extra: Record<string, unknown> = {}) {
  return {
    companyName: "New Drains Ltd",
    contactName: "Sam New",
    email: "sam@newdrains.co.uk",
    phone: "07912 345678",
    servicesOffered: ["plumbing"],
    leadTypes: { plumbing: ["plumbing"] },
    basePostcode: "DH1 3AA",
    radiusMiles: 20,
    businessType: "limited",
    companiesHouseNumber: "12345678",
    competentPersonScheme: "none",
    googleProfileUrl: "https://g.page/new-drains",
    description: "Drains and pipes.",
    declaration: { ...supplierDeclarationWording(), given: true },
    terms: { ...applicationTermsWording(), given: true },
    ...extra,
  };
}

const post = (b: object) => POST(new Request("http://localhost/api/supplier-applications", { method: "POST", body: JSON.stringify(b), headers: { "content-type": "application/json" } }));

test("the recommender is stored exactly as typed (trimmed), with the submission time", async () => {
  const res = await post(body({ recommendedBy: "  Best Plumbing Ltd " }));
  assert.equal(res.status, 201);
  const [saved] = await recordStore.listSupplierApplications();
  assert.equal(saved.recommendedBy?.name, "Best Plumbing Ltd");
  assert.equal(saved.recommendedBy?.submittedAt, saved.createdAt);
});

test("leaving it blank stores no recommender", async () => {
  const res = await post(body({ recommendedBy: "" }));
  assert.equal(res.status, 201);
  const [saved] = await recordStore.listSupplierApplications();
  assert.equal(saved.recommendedBy, null);
});

test("more than 120 characters is rejected with a field error", async () => {
  const res = await post(body({ recommendedBy: "x".repeat(121) }));
  assert.equal(res.status, 400);
  const json = (await res.json()) as { fields: Record<string, string> };
  assert.ok(json.fields.recommendedBy);
});
