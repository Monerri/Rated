import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRows } from "@/lib/checkSummary";
import { specialist } from "./helpers";

const guaranteeRow = (extra: Parameters<typeof specialist>[1]) => checkRows(specialist("sole-sam", extra)).find((r) => r.title === "Insurance-backed guarantee")!;

test("without an insurance-backed guarantee, homeowners see the business's own guarantee", () => {
  assert.deepEqual(guaranteeRow({ workmanshipGuaranteeYears: 5 }), {
    title: "Insurance-backed guarantee",
    status: "partial",
    detail: "Own 5-year guarantee, not insurance-backed",
  });
  assert.equal(guaranteeRow({ workmanshipGuaranteeYears: 0 }).detail, "No written guarantee of its own");
  assert.equal(guaranteeRow({}).detail, "Not checked");
});

test("an insurance-backed guarantee still shows its provider", () => {
  const row = guaranteeRow({
    workmanshipGuaranteeYears: 10,
    checks: [
      { id: "registered_company", passed: true, evidence: "Sole trader: identity and address checked", soleTrader: true },
      { id: "insurance_backed_guarantee", passed: true, evidence: "Provider: QANW" },
    ],
  });
  assert.equal(row.status, "passed");
  assert.equal(row.detail, "QANW");
});
