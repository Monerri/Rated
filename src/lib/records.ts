import type { InterestRegistration } from "@/lib/types";

/**
 * Persistence boundary. Pages and API routes call this interface only, so
 * swapping the prototype store for Supabase touches this file alone.
 */
export interface RecordStore {
  saveInterestRegistration(record: InterestRegistration): Promise<{ id: string }>;
}

/**
 * Prototype store: nothing is persisted. Records are written to the server
 * log so the shape can be checked during development.
 */
const prototypeStore: RecordStore = {
  async saveInterestRegistration(record) {
    const id = crypto.randomUUID();
    console.info("[prototype] interest registration (not persisted)", {
      id,
      ...record,
      email: "[redacted]",
    });
    return { id };
  },
};

export const recordStore: RecordStore = prototypeStore;
