import { specialists as demoSpecialists } from "@/data/specialists";
import { recordStore } from "@/lib/records";
import type { Specialist } from "@/lib/types";

/**
 * Every specialist: the fictional demo companies in data/specialists.ts plus
 * the real ones approved on /admin and stored in the database. Server only.
 */
export async function allSpecialists(): Promise<Specialist[]> {
  const stored = await recordStore.listSpecialists();
  const slugs = new Set(stored.map((s) => s.slug));
  return [...demoSpecialists.filter((s) => !slugs.has(s.slug)), ...stored];
}

/**
 * Specialists who can be considered for leads: demo companies, and real ones
 * who have accepted the Specialist terms. Whether they're switched on, vetted
 * and funded is checked separately.
 */
export async function activeSpecialists(): Promise<Specialist[]> {
  return (await allSpecialists()).filter((s) => !s.onboarding || s.onboarding.status === "active");
}

export async function findSpecialist(slug: string): Promise<Specialist | undefined> {
  return (await allSpecialists()).find((s) => s.slug === slug);
}

/** Names by slug, for reports and admin lists. */
export async function specialistNames(): Promise<Record<string, string>> {
  return Object.fromEntries((await allSpecialists()).map((s) => [s.slug, s.name]));
}
