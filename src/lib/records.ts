import type { Enquiry, InterestRegistration, SavedProgress, ServiceOverride, SupplierApplication } from "@/lib/types";

/**
 * Persistence boundary. Pages and API routes call this interface only, so
 * swapping the prototype store for Supabase touches this file alone.
 */
export interface RecordStore {
  saveInterestRegistration(record: InterestRegistration): Promise<void>;
  getInterestRegistration(token: string): Promise<InterestRegistration | null>;
  listInterestRegistrations(serviceSlug: string): Promise<InterestRegistration[]>;
  updateInterestRegistration(
    token: string,
    patch: Partial<Pick<InterestRegistration, "notifiedAt" | "unsubscribedAt">>,
  ): Promise<void>;

  saveEnquiry(record: Enquiry): Promise<void>;
  updateEnquiry(id: string, patch: Partial<Pick<Enquiry, "customerNotifiedAt" | "specialistNotifiedAt">>): Promise<void>;

  saveProgress(record: SavedProgress): Promise<void>;
  getProgress(token: string): Promise<SavedProgress | null>;
  deleteProgress(token: string): Promise<boolean>;

  getServiceOverrides(): Promise<ServiceOverride[]>;
  saveServiceOverride(override: ServiceOverride): Promise<void>;

  saveSupplierApplication(record: SupplierApplication): Promise<void>;
}

/**
 * Prototype store. Records live in server memory only: they disappear on
 * restart and are not shared between server instances. Kept on globalThis
 * so every route in the process sees the same data. Contact details are
 * redacted from the log.
 */
interface Memory {
  interest: Map<string, InterestRegistration>;
  enquiries: Map<string, Enquiry>;
  progress: Map<string, SavedProgress>;
  overrides: Map<string, ServiceOverride>;
  suppliers: Map<string, SupplierApplication>;
}

const g = globalThis as typeof globalThis & { __vnMemory?: Memory };
const memory: Memory = (g.__vnMemory ??= {
  interest: new Map(),
  enquiries: new Map(),
  progress: new Map(),
  overrides: new Map(),
  suppliers: new Map(),
});

function log(label: string, record: object) {
  console.info(`[prototype] ${label} (in memory only)`, JSON.stringify(record, redact, 2));
}

function redact(key: string, value: unknown) {
  return ["email", "phone", "lastName", "token"].includes(key) ? "[redacted]" : value;
}

const prototypeStore: RecordStore = {
  async saveInterestRegistration(record) {
    memory.interest.set(record.token, record);
    log("interest registration", record);
  },
  async getInterestRegistration(token) {
    return memory.interest.get(token) ?? null;
  },
  async listInterestRegistrations(serviceSlug) {
    return [...memory.interest.values()].filter((r) => r.serviceSlug === serviceSlug);
  },
  async updateInterestRegistration(token, patch) {
    const r = memory.interest.get(token);
    if (r) memory.interest.set(token, { ...r, ...patch });
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

  async getServiceOverrides() {
    return [...memory.overrides.values()];
  },
  async saveServiceOverride(override) {
    memory.overrides.set(override.serviceSlug, override);
    log("service override", override);
  },

  async saveSupplierApplication(record) {
    memory.suppliers.set(record.id, record);
    log("supplier application", record);
  },
};

export const recordStore: RecordStore = prototypeStore;
