/**
 * What a lead costs a specialist, in credits. One credit is worth £1, and
 * specialists always see the pound value alongside. We're not VAT registered,
 * so no VAT is added; see pricesIncludeVat below.
 *
 * From the "Lead Generation Pricing Benchmark" sheet (October 2026). A change
 * here applies to leads sent after the next deploy; leads already sent keep
 * the price they were charged.
 *
 * - shared: the homeowner asked to hear from two or three specialists
 * - exclusive: the homeowner asked to hear from one specialist only
 *
 * "heat-pumps" covers heat pumps and air conditioning (one category in the sheet).
 *
 * A kind of job can have its own price with a "service/kind" key, for
 * example "extensions/new-build". Without one, the service's price applies.
 */
type Prices = Record<string, { shared: number; exclusive: number }>;

/** North East England and the rest of the UK. */
const basePrices: Prices = {
  extensions: { exclusive: 100, shared: 50 },
  "extensions/new-build": { exclusive: 200, shared: 100 },
  "loft-conversions": { exclusive: 100, shared: 50 },
  "architecture-planning": { exclusive: 100, shared: 50 },
  "conservatory-roofs": { exclusive: 60, shared: 30 },
  "solar-battery": { exclusive: 70, shared: 35 },
  "heat-pumps": { exclusive: 60, shared: 30 },
  bathrooms: { exclusive: 60, shared: 30 },
  kitchens: { exclusive: 60, shared: 30 },
  roofing: { exclusive: 60, shared: 30 },
  "windows-doors": { exclusive: 40, shared: 20 },
  insulation: { exclusive: 40, shared: 20 },
  "gardens-driveways": { exclusive: 40, shared: 20 },
  flooring: { exclusive: 30, shared: 15 },
  "ev-charging": { exclusive: 30, shared: 15 },
  plumbing: { exclusive: 30, shared: 15 },
  electrical: { exclusive: 30, shared: 15 },
  "security-systems": { exclusive: 30, shared: 15 },
};

/** London and the South East, used once that region is added. */
const londonSouthEastPrices: Prices = {
  extensions: { exclusive: 120, shared: 60 },
  "extensions/new-build": { exclusive: 240, shared: 120 },
  "loft-conversions": { exclusive: 120, shared: 60 },
  "architecture-planning": { exclusive: 120, shared: 60 },
  "conservatory-roofs": { exclusive: 90, shared: 45 },
  "solar-battery": { exclusive: 90, shared: 45 },
  "heat-pumps": { exclusive: 80, shared: 40 },
  bathrooms: { exclusive: 90, shared: 45 },
  kitchens: { exclusive: 90, shared: 45 },
  roofing: { exclusive: 90, shared: 45 },
  "windows-doors": { exclusive: 60, shared: 30 },
  insulation: { exclusive: 60, shared: 30 },
  "gardens-driveways": { exclusive: 60, shared: 30 },
  flooring: { exclusive: 40, shared: 20 },
  "ev-charging": { exclusive: 40, shared: 20 },
  plumbing: { exclusive: 40, shared: 20 },
  electrical: { exclusive: 40, shared: 20 },
  "security-systems": { exclusive: 40, shared: 20 },
};

/** Prices by region slug (see config/regions.ts). Regions not listed use basePrices. */
export const regionalLeadPrices: Record<string, Prices> = {
  "london-south-east": londonSouthEastPrices,
};

export const leadPrices: Prices = basePrices;

/**
 * Whether the prices above are final. While false, applicants are told we'll
 * send prices when we review their application, instead of being shown them.
 */
export const pricesConfirmed = true;

/** Used for any service not listed above. */
export const defaultLeadPrice = { shared: 30, exclusive: 60 };

/**
 * Non-urgent leads, where the homeowner plans the work in 3 to 6 months, are
 * discounted. Specialists can opt out of them per service (see skipLaterLeadsFor).
 */
export const laterLeadDiscountPercent = 25;
export const LATER_TIMESCALE = "3-6-months";

/**
 * Bonus credits for larger top-ups. A top-up of at least `fromPounds` gets
 * this percentage extra, rounded down to whole credits. Highest tier first.
 * Bonus credits are never paid out as cash (see Specialist terms).
 */
export const creditBonusTiers: { fromPounds: number; percent: number }[] = [
  { fromPounds: 1000, percent: 15 },
  { fromPounds: 500, percent: 10 },
  { fromPounds: 250, percent: 4 },
];

/** The value of one credit, in pence. */
export const pencePerCredit = 100;

/**
 * Whether we're VAT registered. While false, no VAT is charged or shown. Once
 * registered, prices are quoted plus VAT and the wording changes to say so.
 */
export const vatRegistered = false;

/** Suppliers' credit is held for this long after they choose to leave, in case they return. */
export const leaverCreditHoldMonths = 6;
