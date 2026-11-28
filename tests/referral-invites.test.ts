import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ordinal, ordinalDate } from "@/lib/format";
import { referralInviteEmail, sendDueReferralInvites, sendReferralInviteNow, stopOffers } from "@/lib/referralInvites";
import { recordStore } from "@/lib/records";
import { resetMemory, specialist } from "./helpers";

beforeEach(resetMemory);

test("dates use the owner's style: 1st. January, 31st. January 2027", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal), ["1st.", "2nd.", "3rd.", "4th.", "11th.", "12th.", "13th.", "21st.", "22nd.", "23rd.", "31st."]);
  assert.equal(ordinalDate("2027-01-01T00:00:00Z"), "1st. January");
  assert.equal(ordinalDate("2027-01-31T23:59:59Z", true), "31st. January 2027");
});

test("the email is personalised and has no '1 January' style dates", () => {
  const s = specialist("best-plumbing", { contactName: "Pat Owner" });
  const e = referralInviteEmail(s, "https://example.test/offers/stop/abc", new Date("2026-12-01T09:40:00Z"));
  assert.ok(e.text.startsWith("Hi Pat,"));
  assert.ok(e.text.includes(`enter "Best Plumbing Ltd" in the "Who recommended us?" box`));
  assert.ok(e.text.includes("Apply before 1st. January and, if you're approved, you'll get 150 free credits"));
  assert.ok(e.text.includes("That's 180 credits (£180 of introductions)"));
  assert.ok(e.text.includes("apply by 31st. January 2027"));
  assert.ok(e.text.includes("https://example.test/offers/stop/abc"));
  assert.ok(!/\b\d{1,2} (January|December) /.test(e.text), "no '1 January' style dates");
  assert.ok(!e.text.includes("—"), "no em dashes");
});

test("after the Founding offer closes, the forwarded message offers only the welcome credits", () => {
  const e = referralInviteEmail(specialist("best-plumbing"), "x", new Date("2027-01-10T09:40:00Z"));
  assert.ok(!e.text.includes("150 free credits"));
  assert.ok(e.text.includes("If you're approved, you'll get 50 free credits, plus 30 extra"));
  assert.ok(e.text.includes("That's 80 credits (£80 of introductions)"));
});

test("the daily job sends once, the morning after going live, only to specialists live from the start date", async () => {
  const live = (slug: string, acceptedAt: string, extra = {}) => specialist(slug, { acceptedAt, ...extra });
  await recordStore.saveSpecialist(live("yesterday-co", "2026-12-01T15:00:00.000Z"));
  await recordStore.saveSpecialist(live("today-co", "2026-12-02T08:00:00.000Z"));
  await recordStore.saveSpecialist(live("first-signup-co", "2026-11-20T10:00:00.000Z"));
  await recordStore.saveSpecialist(specialist("waiting-co", { status: "awaiting_terms" }));
  const now = new Date("2026-12-02T09:40:00Z");

  assert.deepEqual(await sendDueReferralInvites("https://example.test", now), { sent: 1 });
  const bySlug = Object.fromEntries((await recordStore.listSpecialists()).map((s) => [s.slug, s]));
  assert.ok(bySlug["yesterday-co"].onboarding!.referralInviteSentAt);
  assert.ok(bySlug["yesterday-co"].onboarding!.offersToken);
  assert.ok(!bySlug["today-co"].onboarding!.referralInviteSentAt, "today's waits until tomorrow");
  assert.ok(!bySlug["first-signup-co"].onboarding!.referralInviteSentAt, "earlier specialists aren't sent it automatically");

  // Never twice.
  assert.deepEqual(await sendDueReferralInvites("https://example.test", now), { sent: 0 });
});

test("the stop link stops offers, and blocks sending from /admin", async () => {
  await recordStore.saveSpecialist(specialist("first-signup-co", { acceptedAt: "2026-11-20T10:00:00.000Z" }));
  assert.deepEqual(await sendReferralInviteNow("first-signup-co", "https://example.test", new Date("2026-12-02T10:00:00Z")), { ok: true });
  const token = (await recordStore.listSpecialists())[0].onboarding!.offersToken!;
  assert.equal(await stopOffers("not-a-token"), false);
  assert.equal(await stopOffers(token), true);
  const s = (await recordStore.listSpecialists())[0];
  assert.ok(s.onboarding!.offersOptOut);
  // Clear the sent date to check the opt-out alone still blocks it.
  await recordStore.saveSpecialist({ ...s, onboarding: { ...s.onboarding!, referralInviteSentAt: null } });
  const again = await sendReferralInviteNow("first-signup-co", "https://example.test", new Date("2026-12-03T10:00:00Z"));
  assert.equal(again.ok, false);
});

test("nothing is sent once the referral scheme has closed", async () => {
  await recordStore.saveSpecialist(specialist("late-co", { acceptedAt: "2027-01-31T10:00:00.000Z" }));
  assert.deepEqual(await sendDueReferralInvites("https://example.test", new Date("2027-02-01T09:40:00Z")), { sent: 0 });
});
