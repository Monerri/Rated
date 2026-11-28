import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRows } from "@/lib/checkSummary";
import { demoSpecialist } from "@/data/specialists";
import { specialist } from "./helpers";

const rows = (extra: Parameters<typeof specialist>[1]) => checkRows(specialist("sole-sam", extra));
const row = (extra: Parameters<typeof specialist>[1], title: string) => rows(extra).find((r) => r.title === title);

test("the workmanship guarantee shows as a tick with its length", () => {
  assert.deepEqual(row({ workmanshipGuaranteeYears: 5 }, "Workmanship guarantee"), { title: "Workmanship guarantee", status: "passed", detail: "5 years" });
  assert.equal(row({ workmanshipGuaranteeYears: 1 }, "Workmanship guarantee")!.detail, "1 year");
  assert.deepEqual(row({ workmanshipGuaranteeYears: 0 }, "Workmanship guarantee"), { title: "Workmanship guarantee", status: "partial", detail: "No written guarantee" });
  assert.equal(row({}, "Workmanship guarantee")!.detail, "Not confirmed yet");
});

test("without an insurance-backed guarantee there's no extra line, and nothing negative about it", () => {
  const r = rows({ workmanshipGuaranteeYears: 5 });
  assert.equal(r.length, 4);
  assert.ok(!r.some((x) => x.title === "Insurance-backed guarantee"));
});

test("an insurance-backed guarantee is an extra, highlighted line with its provider", () => {
  const r = rows({
    workmanshipGuaranteeYears: 10,
    checks: [
      { id: "registered_company", passed: true, evidence: "Sole trader: identity and address checked", soleTrader: true },
      { id: "insurance_backed_guarantee", passed: true, evidence: "Provider: QANW" },
    ],
  });
  assert.equal(r.length, 5);
  assert.deepEqual(r.find((x) => x.title === "Insurance-backed guarantee"), {
    title: "Insurance-backed guarantee",
    status: "passed",
    detail: "QANW",
    special: true,
  });
  assert.equal(r.find((x) => x.title === "Workmanship guarantee")!.status, "passed");
});

test("the homepage example shows both guarantees", () => {
  const titles = checkRows(demoSpecialist).map((r) => r.title);
  assert.ok(titles.includes("Workmanship guarantee") && titles.includes("Insurance-backed guarantee"));
});
