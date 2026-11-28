import { test } from "node:test";
import assert from "node:assert/strict";
import { services } from "@/config/services";
import { leadPrices } from "@/config/pricing";
import { serviceKeywords } from "@/config/serviceKeywords";
import { serviceSchemes } from "@/config/schemes";
import { getFunnel } from "@/funnels";
import { pricesFor } from "@/lib/billing";
import { matchesSearch } from "@/lib/serviceSearch";

const live = services.filter((s) => s.status === "live");

test("every live service has a questionnaire, a price, search words and a How we check entry", () => {
  for (const s of live) {
    assert.ok(getFunnel(s.slug), `${s.slug}: questionnaire`);
    assert.ok(leadPrices[s.slug], `${s.slug}: price`);
    assert.ok(serviceKeywords[s.slug]?.length, `${s.slug}: search words`);
    assert.ok(serviceSchemes[s.slug], `${s.slug}: How we check`);
  }
});

test("everyday searches find the new services", () => {
  const finds = (query: string, slug: string) =>
    assert.ok(live.filter((s) => matchesSearch(s, query)).some((s) => s.slug === slug), `"${query}" should find ${slug}`);
  finds("painter and decorator", "painting-decorating");
  finds("wallpapering", "painting-decorating");
  finds("skimming", "plastering");
  finds("render", "plastering");
  finds("fitted wardrobes", "carpentry-joinery");
  finds("joiner", "carpentry-joinery");
  finds("fascias and soffits", "roofline");
  finds("gutters", "roofline");
  finds("log burner", "stoves");
  finds("rising damp", "damp-proofing");
  finds("repointing", "extensions");
  finds("garage door", "windows-doors");
});

test("brickwork and garage doors are their own kinds of job", () => {
  const ext = getFunnel("extensions")!.leadTypes!;
  assert.equal(ext.of({ extensionType: "brickwork" }), "brickwork");
  assert.deepEqual(pricesFor("extensions", "brickwork"), { exclusive: 40, shared: 20 });
  const win = getFunnel("windows-doors")!.leadTypes!;
  assert.equal(win.of({ improve: "garage" }), "garage-doors");
  assert.equal(win.of({ improve: "both" }), "windows-doors");
});

test("decorating and plastering leads go to specialists who take that kind of work", () => {
  assert.deepEqual(getFunnel("painting-decorating")!.leadTypes!.of({ work: ["walls-ceilings", "spray-upvc"] }), ["interior", "spraying"]);
  assert.deepEqual(getFunnel("plastering")!.leadTypes!.of({ work: ["render"] }), ["rendering"]);
  assert.deepEqual(getFunnel("carpentry-joinery")!.leadTypes!.of({ work: ["wardrobes"] }), ["fitted-furniture"]);
});

test("Electrical comes before Insulation", () => {
  const order = live.map((s) => s.slug);
  assert.ok(order.indexOf("electrical") < order.indexOf("insulation"));
});
