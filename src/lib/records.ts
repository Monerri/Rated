import type { Enquiry, InterestRegistration, SavedProgress } from "@/lib/types";

/**
 * Persistence boundary. Pages and API routes call this interface only, so
 * swapping the prototype store for Supabase touches this file alone.
 */
export interface RecordStore {
  saveInterestRegistration(record: InterestRegistration): Promise<{ id: string }>;
  saveEnquiry(record: Enquiry): Promise<void>;
  updateEnquiry(id: string, patch: Partial<Pick<Enquiry, "customerNotifiedAt" | "specialistNotifiedAt">>): Promise<void>;
  saveProgress(record: SavedProgress): Promise<void>;
  getProgress(token: string): Promise<SavedProgress | null>;
  deleteProgress(token: string): Promise<boolean>;
}

/**
 * Prototype store. Records live in server memory only: they disappear on
 * restart and are not shared between server instances. Contact details are
 * redacted from the log.
 */
const memory = {
  enquiries: new Map<string, Enquiry>(),
  progress: new Map<string, SavedProgress>(),
};

function log(label: string, record: object) {
  console.info(`[prototype] ${label} (in memory only)`, JSON.stringify(record, redact, 2));
}

function redact(key: string, value: unknown) {
  return ["email", "phone", "lastName"].includes(key) ? "[redacted]" : value;
}

const prototypeStore: RecordStore = {
  async saveInterestRegistration(record) {
    const id = crypto.randomUUID();
    log("interest registration", { id, ...record });
    return { id };
  },
  async saveEnquiry(record) {
    memory.enquiries.set(record.id, record);
    log("enquiry", record);
  },
  async updateEnquiry(id, patch) {
    const e = memory.enquiries.get(id);
    if (e) memory.enquiries.set(id, { ...e, ...patch });
  },
  async saveProgress(record) {
    memory.progress.set(record.token, record);
    log("saved progress", record);
  },
  async getProgress(token) {
    return memory.progress.get(token) ?? null;
  },
  async deleteProgress(token) {
    const existed = memory.progress.delete(token);
    if (existed) console.info("[prototype] saved progress deleted");
    return existed;
  },
};

export const recordStore: RecordStore = prototypeStore;
