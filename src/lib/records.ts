import { bindings, type D1 } from "@/lib/cloudflare";
import { SAVED_PROGRESS_MONTHS } from "@/lib/consent";
import type {
  Enquiry,
  FeedbackRequest,
  InterestRegistration,
  LedgerEntry,
  ListingSwitch,
  MissedLead,
  SavedProgress,
  ServiceOverride,
  SupplierApplication,
} from "@/lib/types";

/**
 * Persistence boundary. Pages and API routes call this interface only.
 * On Cloudflare, records are kept in the D1 database bound as DB. Without that binding (local `next dev`, the build) the
 * in-memory prototype store is used instead.
 */
export interface RecordStore {
  saveInterestRegistration(record: InterestRegistration): Promise<void>;
  getInterestRegistration(token: string): Promise<InterestRegistration | null>;
  listInterestRegistrations(serviceSlug: string): Promise<InterestRegistration[]>;
  deleteInterestRegistration(token: string): Promise<void>;
  updateInterestRegistration(
    token: string,
    patch: Partial<Pick<InterestRegistration, "notifiedAt" | "unsubscribedAt">>,
  ): Promise<void>;

  saveEnquiry(record: Enquiry): Promise<void>;
  updateEnquiry(
    id: string,
    patch: Partial<Pick<Enquiry, "customerNotifiedAt" | "specialistNotifications" | "feedbackRequestedAt">>,
  ): Promise<void>;
  /** Enquiries created between two dates (ISO), oldest first. */
  listEnquiries(from: string, to: string): Promise<Enquiry[]>;

  saveFeedback(record: FeedbackRequest): Promise<void>;
  getFeedback(token: string): Promise<FeedbackRequest | null>;
  /** Feedback requests created since a date, newest first. */
  listFeedback(since: string): Promise<FeedbackRequest[]>;

  saveProgress(record: SavedProgress): Promise<void>;
  getProgress(token: string): Promise<SavedProgress | null>;
  deleteProgress(token: string): Promise<boolean>;

  getServiceOverrides(): Promise<ServiceOverride[]>;
  saveServiceOverride(override: ServiceOverride): Promise<void>;

  saveSupplierApplication(record: SupplierApplication): Promise<void>;

  /** Adds a line to a specialist's account. */
  addLedgerEntry(entry: LedgerEntry): Promise<void>;
  /**
   * Adds a lead charge only if the balance covers it, in one atomic step, so
   * two leads at once can't spend the same money. False if it doesn't.
   */
  chargeIfFunded(entry: LedgerEntry): Promise<boolean>;
  /** Current balance in pence for every specialist with an account. */
  getBalances(): Promise<Record<string, number>>;
  /** Ledger lines since a date (ISO), newest first. */
  listLedger(since: string, limit?: number): Promise<LedgerEntry[]>;
  saveMissedLead(record: MissedLead): Promise<void>;
  listMissedLeads(since: string): Promise<MissedLead[]>;

  /** Records a manual on/off switch for a specialist's listing. */
  addListingSwitch(record: ListingSwitch): Promise<void>;
  /** The latest switch for every specialist who has one. */
  getListingSwitches(): Promise<Record<string, ListingSwitch>>;
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
  ledger: LedgerEntry[];
  missed: MissedLead[];
  feedback: Map<string, FeedbackRequest>;
  switches: ListingSwitch[];
}

const g = globalThis as typeof globalThis & { __vnMemory?: Memory };
const memory: Memory = (g.__vnMemory ??= {
  interest: new Map(),
  enquiries: new Map(),
  progress: new Map(),
  overrides: new Map(),
  suppliers: new Map(),
  ledger: [],
  missed: [],
  feedback: new Map(),
  switches: [],
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
  async deleteInterestRegistration(token) {
    memory.interest.delete(token);
  },
  async updateInterestRegistration(token, patch) {
    const r = memory.interest.get(token);
    if (r) memory.interest.set(token, { ...r, ...patch });
  },

  async saveEnquiry(record) {
    memory.enquiries.set(record.id, record);
    log("enquiry", record);
  },
  async listEnquiries(from, to) {
    return [...memory.enquiries.values()].filter((e) => e.createdAt >= from && e.createdAt < to);
  },
  async saveFeedback(record) {
    memory.feedback.set(record.token, record);
  },
  async getFeedback(token) {
    return memory.feedback.get(token) ?? null;
  },
  async listFeedback(since) {
    return [...memory.feedback.values()].filter((f) => f.createdAt >= since).reverse();
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

  async addLedgerEntry(entry) {
    memory.ledger.push(entry);
  },
  async chargeIfFunded(entry) {
    const balance = memory.ledger.filter((e) => e.supplierSlug === entry.supplierSlug).reduce((t, e) => t + e.amountPence, 0);
    if (balance < -entry.amountPence) return false;
    memory.ledger.push(entry);
    return true;
  },
  async getBalances() {
    const out: Record<string, number> = {};
    for (const e of memory.ledger) out[e.supplierSlug] = (out[e.supplierSlug] ?? 0) + e.amountPence;
    return out;
  },
  async listLedger(since, limit = 500) {
    return memory.ledger.filter((e) => e.createdAt >= since).reverse().slice(0, limit);
  },
  async saveMissedLead(record) {
    memory.missed.push(record);
  },
  async listMissedLeads(since) {
    return memory.missed.filter((m) => m.createdAt >= since);
  },
  async addListingSwitch(record) {
    (memory.switches ??= []).push(record);
    log("listing switch", record);
  },
  async getListingSwitches() {
    const out: Record<string, ListingSwitch> = {};
    for (const r of memory.switches ?? []) out[r.supplierSlug] = r;
    return out;
  },
};

/**
 * D1 tables. Each record is stored whole as JSON in `data`, with the few
 * fields we look up or tidy by pulled out into columns. Created by the site
 * itself through its database binding, so deploys need no database access.
 * Add new statements to the end; never edit existing ones.
 */
const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS interest_registrations (token TEXT PRIMARY KEY, service_slug TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS interest_by_service ON interest_registrations (service_slug)",
  "CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS saved_progress (token TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS service_overrides (service_slug TEXT PRIMARY KEY, data TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS supplier_applications (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL)",
  // Prepaid accounts. Lines are only ever added; the balance is their sum.
  "CREATE TABLE IF NOT EXISTS ledger (id TEXT PRIMARY KEY, supplier_slug TEXT NOT NULL, created_at TEXT NOT NULL, kind TEXT NOT NULL, amount_pence INTEGER NOT NULL, enquiry_id TEXT, note TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS ledger_by_supplier ON ledger (supplier_slug, created_at)",
  // A specialist can only ever be charged once for the same enquiry.
  "CREATE UNIQUE INDEX IF NOT EXISTS ledger_one_charge_per_lead ON ledger (enquiry_id, supplier_slug) WHERE kind = 'lead'",
  "CREATE TABLE IF NOT EXISTS missed_leads (id TEXT PRIMARY KEY, supplier_slug TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS feedback (token TEXT PRIMARY KEY, enquiry_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, data TEXT NOT NULL)",
  // Manual on/off switches for listings. Lines are only ever added; the latest one counts.
  "CREATE TABLE IF NOT EXISTS listing_switches (id TEXT PRIMARY KEY, supplier_slug TEXT NOT NULL, created_at TEXT NOT NULL, is_on INTEGER NOT NULL, note TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS listing_switches_by_supplier ON listing_switches (supplier_slug, created_at)",
];

/**
 * Deletes records past the retention periods in the privacy notice.
 * Timestamps are ISO 8601 strings, so they compare correctly as text.
 * Supplier applications are reviewed by hand instead: unsuccessful ones are
 * kept 24 months, businesses that join for longer.
 */
const RETENTION = [
  `DELETE FROM saved_progress WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-${SAVED_PROGRESS_MONTHS} months')`,
  "DELETE FROM enquiries WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months')",
  "DELETE FROM interest_registrations WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months')",
  "DELETE FROM feedback WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months')",
  "DELETE FROM missed_leads WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months')",
  // The ledger is a financial record and is kept: it holds no homeowner details, only enquiry ids.
  // Listing switches are kept too, as the record of when each specialist was on or off.
];

/** How often the retention clean-up runs, at most. */
const RETENTION_INTERVAL_MS = 6 * 60 * 60 * 1000;

const state = globalThis as typeof globalThis & { __vnSchema?: Promise<void>; __vnRetentionAt?: number };

/** Creates the tables once per Worker instance, and tidies old records every few hours. */
async function prepare(db: D1): Promise<void> {
  state.__vnSchema ??= db
    .batch(SCHEMA.map((sql) => db.prepare(sql)))
    .then(() => undefined)
    .catch((err) => {
      state.__vnSchema = undefined; // try again on the next request
      throw err;
    });
  await state.__vnSchema;

  const now = Date.now();
  if (now - (state.__vnRetentionAt ?? 0) > RETENTION_INTERVAL_MS) {
    state.__vnRetentionAt = now;
    await db.batch(RETENTION.map((sql) => db.prepare(sql))).catch((err) => {
      console.error("Retention clean-up failed", err instanceof Error ? err.message : err);
    });
  }
}

/** D1 store, with the tables prepared before first use. */
function d1Store(db: D1): RecordStore {
  const store = d1Queries(db);
  return Object.fromEntries(
    Object.entries(store).map(([name, fn]) => [
      name,
      async (...args: unknown[]) => {
        await prepare(db);
        return (fn as (...a: unknown[]) => unknown)(...args);
      },
    ]),
  ) as unknown as RecordStore;
}

function d1Queries(db: D1): RecordStore {
  const one = async <T>(sql: string, key: string) => {
    const row = await db.prepare(sql).bind(key).first<{ data: string }>();
    return row ? (JSON.parse(row.data) as T) : null;
  };
  const patchJson = async <T extends object>(table: string, keyCol: string, key: string, patch: Partial<T>) => {
    const current = await one<T>(`SELECT data FROM ${table} WHERE ${keyCol} = ?`, key);
    if (!current) return;
    await db
      .prepare(`UPDATE ${table} SET data = ? WHERE ${keyCol} = ?`)
      .bind(JSON.stringify({ ...current, ...patch }), key)
      .run();
  };

  return {
    async saveInterestRegistration(r) {
      await db
        .prepare("INSERT OR REPLACE INTO interest_registrations (token, service_slug, created_at, data) VALUES (?, ?, ?, ?)")
        .bind(r.token, r.serviceSlug, r.createdAt, JSON.stringify(r))
        .run();
    },
    getInterestRegistration: (token) =>
      one<InterestRegistration>("SELECT data FROM interest_registrations WHERE token = ?", token),
    async listInterestRegistrations(serviceSlug) {
      const { results } = await db
        .prepare("SELECT data FROM interest_registrations WHERE service_slug = ? ORDER BY created_at")
        .bind(serviceSlug)
        .all<{ data: string }>();
      return results.map((row) => JSON.parse(row.data) as InterestRegistration);
    },
    async deleteInterestRegistration(token) {
      await db.prepare("DELETE FROM interest_registrations WHERE token = ?").bind(token).run();
    },
    updateInterestRegistration: (token, patch) =>
      patchJson<InterestRegistration>("interest_registrations", "token", token, patch),

    async saveEnquiry(e) {
      await db
        .prepare("INSERT OR REPLACE INTO enquiries (id, created_at, data) VALUES (?, ?, ?)")
        .bind(e.id, e.createdAt, JSON.stringify(e))
        .run();
    },
    updateEnquiry: (id, patch) => patchJson<Enquiry>("enquiries", "id", id, patch),
    async listEnquiries(from, to) {
      const { results } = await db
        .prepare("SELECT data FROM enquiries WHERE created_at >= ? AND created_at < ? ORDER BY created_at")
        .bind(from, to)
        .all<{ data: string }>();
      return results.map((row) => JSON.parse(row.data) as Enquiry);
    },
    async saveFeedback(f) {
      await db
        .prepare("INSERT OR REPLACE INTO feedback (token, enquiry_id, created_at, data) VALUES (?, ?, ?, ?)")
        .bind(f.token, f.enquiryId, f.createdAt, JSON.stringify(f))
        .run();
    },
    getFeedback: (token) => one<FeedbackRequest>("SELECT data FROM feedback WHERE token = ?", token),
    async listFeedback(since) {
      const { results } = await db
        .prepare("SELECT data FROM feedback WHERE created_at >= ? ORDER BY created_at DESC")
        .bind(since)
        .all<{ data: string }>();
      return results.map((row) => JSON.parse(row.data) as FeedbackRequest);
    },

    async saveProgress(p) {
      await db
        .prepare("INSERT OR REPLACE INTO saved_progress (token, created_at, data) VALUES (?, ?, ?)")
        .bind(p.token, p.createdAt, JSON.stringify(p))
        .run();
    },
    getProgress: (token) => one<SavedProgress>("SELECT data FROM saved_progress WHERE token = ?", token),
    async deleteProgress(token) {
      const { meta } = await db.prepare("DELETE FROM saved_progress WHERE token = ?").bind(token).run();
      return meta.changes > 0;
    },

    async getServiceOverrides() {
      const { results } = await db.prepare("SELECT data FROM service_overrides").all<{ data: string }>();
      return results.map((row) => JSON.parse(row.data) as ServiceOverride);
    },
    async saveServiceOverride(o) {
      await db
        .prepare("INSERT OR REPLACE INTO service_overrides (service_slug, data) VALUES (?, ?)")
        .bind(o.serviceSlug, JSON.stringify(o))
        .run();
    },

    async saveSupplierApplication(a) {
      await db
        .prepare("INSERT OR REPLACE INTO supplier_applications (id, created_at, data) VALUES (?, ?, ?)")
        .bind(a.id, a.createdAt, JSON.stringify(a))
        .run();
    },

    async addLedgerEntry(e) {
      await db
        .prepare(
          "INSERT INTO ledger (id, supplier_slug, created_at, kind, amount_pence, enquiry_id, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(e.id, e.supplierSlug, e.createdAt, e.kind, e.amountPence, e.enquiryId, e.note)
        .run();
    },
    async chargeIfFunded(e) {
      // One statement, so the balance check and the charge can't be separated.
      const { meta } = await db
        .prepare(
          `INSERT INTO ledger (id, supplier_slug, created_at, kind, amount_pence, enquiry_id, note)
           SELECT ?, ?, ?, ?, ?, ?, ?
           WHERE (SELECT COALESCE(SUM(amount_pence), 0) FROM ledger WHERE supplier_slug = ?) >= ?`,
        )
        .bind(e.id, e.supplierSlug, e.createdAt, e.kind, e.amountPence, e.enquiryId, e.note, e.supplierSlug, -e.amountPence)
        .run();
      return meta.changes === 1;
    },
    async getBalances() {
      const { results } = await db
        .prepare("SELECT supplier_slug, SUM(amount_pence) AS balance FROM ledger GROUP BY supplier_slug")
        .all<{ supplier_slug: string; balance: number }>();
      return Object.fromEntries(results.map((r) => [r.supplier_slug, r.balance]));
    },
    async listLedger(since, limit = 500) {
      const { results } = await db
        .prepare(
          "SELECT id, supplier_slug, created_at, kind, amount_pence, enquiry_id, note FROM ledger WHERE created_at >= ? ORDER BY created_at DESC LIMIT ?",
        )
        .bind(since, limit)
        .all<{
          id: string;
          supplier_slug: string;
          created_at: string;
          kind: LedgerEntry["kind"];
          amount_pence: number;
          enquiry_id: string | null;
          note: string;
        }>();
      return results.map((r) => ({
        id: r.id,
        supplierSlug: r.supplier_slug,
        createdAt: r.created_at,
        kind: r.kind,
        amountPence: r.amount_pence,
        enquiryId: r.enquiry_id,
        note: r.note,
      }));
    },
    async saveMissedLead(m) {
      await db
        .prepare("INSERT INTO missed_leads (id, supplier_slug, created_at, data) VALUES (?, ?, ?, ?)")
        .bind(m.id, m.supplierSlug, m.createdAt, JSON.stringify(m))
        .run();
    },
    async listMissedLeads(since) {
      const { results } = await db
        .prepare("SELECT data FROM missed_leads WHERE created_at >= ? ORDER BY created_at")
        .bind(since)
        .all<{ data: string }>();
      return results.map((row) => JSON.parse(row.data) as MissedLead);
    },
    async addListingSwitch(r) {
      await db
        .prepare("INSERT INTO listing_switches (id, supplier_slug, created_at, is_on, note) VALUES (?, ?, ?, ?, ?)")
        .bind(r.id, r.supplierSlug, r.createdAt, r.on ? 1 : 0, r.note)
        .run();
    },
    async getListingSwitches() {
      const { results } = await db
        .prepare(
          `SELECT id, supplier_slug, created_at, is_on, note FROM listing_switches s
           WHERE created_at = (SELECT MAX(created_at) FROM listing_switches WHERE supplier_slug = s.supplier_slug)`,
        )
        .all<{ id: string; supplier_slug: string; created_at: string; is_on: number; note: string }>();
      const out: Record<string, ListingSwitch> = {};
      for (const r of results) {
        out[r.supplier_slug] = { id: r.id, supplierSlug: r.supplier_slug, createdAt: r.created_at, on: r.is_on === 1, note: r.note };
      }
      return out;
    },
  };
}

function currentStore(): RecordStore {
  const db = bindings().DB;
  return db ? d1Store(db) : prototypeStore;
}

/** Picks the store per call, because the D1 binding is only available inside a request. */
export const recordStore: RecordStore = {
  saveInterestRegistration: (r) => currentStore().saveInterestRegistration(r),
  getInterestRegistration: (t) => currentStore().getInterestRegistration(t),
  listInterestRegistrations: (s) => currentStore().listInterestRegistrations(s),
  deleteInterestRegistration: (t) => currentStore().deleteInterestRegistration(t),
  updateInterestRegistration: (t, p) => currentStore().updateInterestRegistration(t, p),
  saveEnquiry: (e) => currentStore().saveEnquiry(e),
  updateEnquiry: (id, p) => currentStore().updateEnquiry(id, p),
  listEnquiries: (from, to) => currentStore().listEnquiries(from, to),
  saveFeedback: (f) => currentStore().saveFeedback(f),
  getFeedback: (t) => currentStore().getFeedback(t),
  listFeedback: (since) => currentStore().listFeedback(since),
  saveProgress: (p) => currentStore().saveProgress(p),
  getProgress: (t) => currentStore().getProgress(t),
  deleteProgress: (t) => currentStore().deleteProgress(t),
  getServiceOverrides: () => currentStore().getServiceOverrides(),
  saveServiceOverride: (o) => currentStore().saveServiceOverride(o),
  saveSupplierApplication: (a) => currentStore().saveSupplierApplication(a),
  addLedgerEntry: (e) => currentStore().addLedgerEntry(e),
  chargeIfFunded: (e) => currentStore().chargeIfFunded(e),
  getBalances: () => currentStore().getBalances(),
  listLedger: (since, limit) => currentStore().listLedger(since, limit),
  saveMissedLead: (m) => currentStore().saveMissedLead(m),
  listMissedLeads: (since) => currentStore().listMissedLeads(since),
  addListingSwitch: (r) => currentStore().addListingSwitch(r),
  getListingSwitches: () => currentStore().getListingSwitches(),
};
