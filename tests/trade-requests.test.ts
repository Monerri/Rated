import { test } from "node:test";
import assert from "node:assert/strict";
import { coveringServices } from "@/lib/serviceSearch";

test("a trade we now offer is recognised as covered", () => {
  assert.deepEqual(coveringServices("Drainage"), ["Drainage & Groundworks"]);
  assert.deepEqual(coveringServices("drainage and groundworks"), ["Drainage & Groundworks"]);
  assert.ok(coveringServices("Septic tanks, lead pipe replacement").includes("Drainage & Groundworks"));
});

test("a trade we don't offer stays on the list, even alongside one we do", () => {
  assert.deepEqual(coveringServices("Chimney sweeping"), []);
  assert.deepEqual(coveringServices("drainage and chimney sweeping"), []);
});
