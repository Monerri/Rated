import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { referralsOpen } from "@/config/referrals";
import {
  awardReferralIfDue,
  confirmationProblem,
  confirmReferral,
  normaliseBusinessName,
  parseRecommendedBy,
  referralFlags,
  suggestRecommenders,
} from "@/lib/referrals";
import { recordStore } from "@/lib/records";
import { cashValueOfBalance } from "@/lib/billing";
import type { LedgerEntry } from "@/lib/types";
import { application, resetMemory, specialist } from "./helpers";

beforeEach(resetMemory);

// --- The form field ---

test("the recommender field is optional, trimmed and at most 120 characters", () => {
  assert.deepEqual(parseRecommendedBy(undefined), { ok: true, name: null });
  assert.deepEqual(parseRecommendedBy("   "), { ok: true, name: null });
  assert.deepEqual(parseRecommendedBy("  Best   Plumbing Ltd  "), { ok: true, name: "Best Plumbing Ltd" });
  assert.equal(parseRecommendedBy("a".repeat(120)).ok, true);
  assert.equal(parseRecommendedBy("a".repeat(121)).ok, false);
  assert.equal(parseRecommendedBy(42).ok, false);
});

// --- Matching ---

test("names are compared without case, Ltd, Limited, punctuation or extra spaces", () => {
  assert.equal(normaliseBusinessName("Smith & Sons Ltd."), normaliseBusinessName("  smith and sons   LIMITED "));
  assert.equal(normaliseBusinessName("A.B. Drains (Ltd)"), "a b drains");
});

test("suggestions only include active specialists, best match first", () => {
  const list = [
    specialist("best-plumbing"),
    specialist("best-plumbing-and-heating"),
    specialist("best-plumbing-north", { status: "awaiting_terms" }),
    specialist("best-plumbing-removed", { status: "removed" }),
    specialist("other-firm"),
  ];
  const out = suggestRecommenders("best plumbing limited", list).map((s) => s.slug);
  assert.equal(out[0], "best-plumbing");
  assert.ok(out.includes("best-plumbing-and-heating"));
  assert.ok(!out.includes("best-plumbing-north") && !out.includes("best-plumbing-removed") && !out.includes("other-firm"));
});

// --- Flags (a) to (d) ---

test("a clean referral has no flags", () => {
  const rec = specialist("best-plumbing", { companyNumber: "87654321" });
  assert.deepEqual(referralFlags({ application: application("a1"), recommender: rec, applications: [], specialists: [rec] }), []);
});

test("(a) flags a missing, unapproved or later-approved recommender", () => {
  const app = application("a1");
  const has = (r: ReturnType<typeof specialist> | null) =>
    referralFlags({ application: app, recommender: r, applications: [], specialists: r ? [r] : [] }).some((f) => f.flag === "recommender_not_approved");
  assert.ok(has(null));
  assert.ok(has(specialist("best-plumbing", { status: "awaiting_terms" })));
  assert.ok(has(specialist("best-plumbing", { status: "removed" })));
  assert.ok(has(specialist("best-plumbing", { acceptedAt: "2026-12-02T00:00:00.000Z" })));
  assert.ok(!has(specialist("best-plumbing")));
});

test("(b) flags an applicant that applied or registered before, by any identifier", () => {
  const rec = specialist("best-plumbing");
  const app = application("a2");
  const earlierDeclined = application("a0", { status: "declined", companyName: "Different Name", email: "x@y.co.uk", phone: "07700900999", companiesHouseNumber: "", createdAt: "2026-10-01T00:00:00.000Z" });
  const flags = referralFlags({ application: app, recommender: rec, applications: [earlierDeclined, app], specialists: [rec] });
  assert.ok(flags.some((f) => f.flag === "not_new" && f.detail.includes("phone")));

  const existing = specialist("new-drains", { companyNumber: "12345678" });
  const f2 = referralFlags({ application: app, recommender: rec, applications: [app], specialists: [rec, existing] });
  assert.ok(f2.some((f) => f.flag === "not_new" && f.detail.includes("Companies House number")));

  // A later application from the same business doesn't count against this one, nor does its own specialist record.
  const later = application("a3", { createdAt: "2026-12-05T00:00:00.000Z" });
  const own = specialist("new-drains", { companyNumber: "12345678", applicationId: "a2" });
  assert.ok(!referralFlags({ application: app, recommender: rec, applications: [app, later], specialists: [rec, own] }).some((f) => f.flag === "not_new"));
});

test("(c) flags self-referral and shared details, but not shared free email providers", () => {
  const rec = specialist("best-plumbing", { companyNumber: "12345678" });
  const self = application("a1", { recommendedBy: { name: "new drains limited", submittedAt: "2026-12-01T12:00:00.000Z" } });
  assert.ok(referralFlags({ application: self, recommender: rec, applications: [], specialists: [rec] }).some((f) => f.flag === "connected" && f.detail.includes("own")));
  assert.ok(referralFlags({ application: application("a2"), recommender: rec, applications: [], specialists: [rec] }).some((f) => f.flag === "connected" && f.detail.includes("Companies House")));

  const sameDomain = specialist("best-plumbing", { enquiryEmail: "jobs@newdrains.co.uk" });
  assert.ok(referralFlags({ application: application("a3"), recommender: sameDomain, applications: [], specialists: [sameDomain] }).some((f) => f.flag === "connected" && f.detail.includes("newdrains.co.uk")));

  const gmailRec = specialist("best-plumbing", { enquiryEmail: "best@gmail.com" });
  const gmailApp = application("a4", { email: "newdrains@gmail.com" });
  assert.ok(!referralFlags({ application: gmailApp, recommender: gmailRec, applications: [], specialists: [gmailRec] }).some((f) => f.flag === "connected"));
});

test("(d) the deadline is 31 January 2027 23:59 UK time", () => {
  assert.equal(referralsOpen("2027-01-31T23:59:59.000Z"), true);
  assert.equal(referralsOpen("2027-02-01T00:00:00.000Z"), false);
  const rec = specialist("best-plumbing");
  const late = application("a1", { createdAt: "2027-02-01T00:00:01.000Z", recommendedBy: { name: "Best Plumbing", submittedAt: "2027-02-01T00:00:01.000Z" } });
  assert.ok(referralFlags({ application: late, recommender: rec, applications: [], specialists: [rec] }).some((f) => f.flag === "late"));
});

test("confirmation needs no blocking flags, a reason for each other flag, and the ownership check", () => {
  assert.match(confirmationProblem({ flags: ["late"], overrides: [{ flag: "late", reason: "x" }], ownershipChecked: true })!, /can't qualify/);
  assert.match(confirmationProblem({ flags: ["not_new"], overrides: [], ownershipChecked: true })!, /reason/);
  assert.match(confirmationProblem({ flags: [], overrides: [], ownershipChecked: false })!, /Companies House/);
  assert.equal(confirmationProblem({ flags: ["connected"], overrides: [{ flag: "connected", reason: "Different owners, checked" }], ownershipChecked: true }), null);
});

// --- The admin flow and the ledger ---

async function setUp() {
  const recommender = specialist("best-plumbing", { companyNumber: "87654321" });
  const app = application("app-1", { status: "accepted" });
  const recommended = specialist("new-drains", { status: "awaiting_terms", applicationId: "app-1", companyNumber: "12345678" });
  await recordStore.saveSpecialist(recommender);
  await recordStore.saveSpecialist(recommended);
  await recordStore.saveSupplierApplication(app);
  return { recommender, app, recommended };
}

const referralLines = async () => (await recordStore.listLedger("2000-01-01")).filter((l) => l.kind === "referral_bonus");

test("only the owner can confirm, and nothing is added before the business accepts the terms", async () => {
  const { app } = await setUp();
  const asAssistant = await confirmReferral({ application: app, recommenderSlug: "best-plumbing", overrides: [], ownershipChecked: true, role: "assistant" });
  assert.equal(asAssistant.ok, false);

  const r = await confirmReferral({ application: app, recommenderSlug: "best-plumbing", overrides: [], ownershipChecked: true, role: "owner" });
  assert.ok(r.ok);
  assert.equal(r.ok && r.outcome.status, "waiting");
  assert.equal((await referralLines()).length, 0);
});

test("once confirmed, approved and terms accepted, both get 30 referral credits once, linked to each other and the application", async () => {
  const { app, recommended } = await setUp();
  await confirmReferral({ application: app, recommenderSlug: "best-plumbing", overrides: [], ownershipChecked: true, role: "owner" });
  await recordStore.saveSpecialist({ ...recommended, onboarding: { ...recommended.onboarding!, status: "active" } });

  const out = await awardReferralIfDue("app-1");
  assert.equal(out.status, "awarded");
  const lines = await referralLines();
  assert.equal(lines.length, 2);
  assert.deepEqual(lines.map((l) => l.amountCredits), [30, 30]);
  const mine = lines.find((l) => l.supplierSlug === "new-drains")!;
  const theirs = lines.find((l) => l.supplierSlug === "best-plumbing")!;
  assert.ok(mine.note.includes(theirs.id) && theirs.note.includes(mine.id));
  assert.ok(mine.note.includes("app-1") && theirs.note.includes("app-1"));

  // Calling again never pays twice.
  assert.equal((await awardReferralIfDue("app-1")).status, "already_awarded");
  assert.equal((await referralLines()).length, 2);
  // And the owner can't confirm it again.
  const again = await confirmReferral({ application: app, recommenderSlug: "best-plumbing", overrides: [], ownershipChecked: true, role: "owner" });
  assert.equal(again.ok, false);
});

test("if the recommender has left by then, only the recommended business is credited", async () => {
  const { app, recommended, recommender } = await setUp();
  await confirmReferral({ application: app, recommenderSlug: "best-plumbing", overrides: [], ownershipChecked: true, role: "owner" });
  await recordStore.saveSpecialist({ ...recommender, onboarding: { ...recommender.onboarding!, status: "removed" } });
  await recordStore.saveSpecialist({ ...recommended, onboarding: { ...recommended.onboarding!, status: "active" } });
  assert.equal((await awardReferralIfDue("app-1")).status, "awarded");
  assert.deepEqual((await referralLines()).map((l) => l.supplierSlug), ["new-drains"]);
});

test("a declined application can't be confirmed", async () => {
  const { app } = await setUp();
  const r = await confirmReferral({ application: { ...app, status: "declined" }, recommenderSlug: "best-plumbing", overrides: [], ownershipChecked: true, role: "owner" });
  assert.equal(r.ok, false);
});

test("referral credits are free credits: never paid out as cash", () => {
  const line = (kind: LedgerEntry["kind"], amountCredits: number, paidPence: number | null = null): LedgerEntry => ({
    id: crypto.randomUUID(), supplierSlug: "s", createdAt: "2026-12-01", kind, amountCredits, paidPence, enquiryId: null, note: "",
  });
  // Only referral credits: nothing to pay out.
  assert.deepEqual(cashValueOfBalance([line("referral_bonus", 30)]), { credits: 30, pence: 0 });
  // £100 bought plus 30 referral credits, then 30 spent: the spend comes from the free credits first, so £100 is refundable.
  assert.equal(cashValueOfBalance([line("topup", 100, 10000), line("referral_bonus", 30), line("lead", -30)]).pence, 10000);
  // With 130 credits left, still no more than was paid.
  assert.equal(cashValueOfBalance([line("topup", 100, 10000), line("referral_bonus", 30)]).pence, 10000);
});
