/**
 * What a lead costs a specialist, in pence, excluding VAT.
 *
 * From the "Lead Generation Pricing Benchmark" sheet (October 2026). A change
 * here applies to leads sent after the next deploy; leads already sent keep
 * the price they were charged.
 *
 * - shared: the homeowner asked to hear from two or three specialists
 * - exclusive: the homeowner asked to hear from one specialist only
 *
 * A kind of job can have its own price with a "service/kind" key, for
 * example "extensions/new-build". Without one, the service's price applies.
 */
type Prices = Record<string, { shared: number; exclusive: number }>;

/** North East England and the rest of the UK. */
const basePrices: Prices = {
  extensions: { exclusive: 10000, shared: 5000 },
  "loft-conversions": { exclusive: 10000, shared: 5000 },
  "architecture-planning": { exclusive: 10000, shared: 5000 },
  "conservatory-roofs": { exclusive: 6000, shared: 3000 },
  "solar-battery": { exclusive: 7000, shared: 3000 },
  "heat-pumps": { exclusive: 6000, shared: 3000 },
  "air-conditioning": { exclusive: 6000, shared: 3000 },
  bathrooms: { exclusive: 6000, shared: 3000 },
  kitchens: { exclusive: 6000, shared: 3000 },
  roofing: { exclusive: 6000, shared: 3000 },
  "windows-doors": { exclusive: 4000, shared: 2000 },
  insulation: { exclusive: 4000, shared: 2000 },
  "gardens-driveways": { exclusive: 4000, shared: 2000 },
  flooring: { exclusive: 3000, shared: 1500 },
  "ev-charging": { exclusive: 3000, shared: 1500 },
  plumbing: { exclusive: 3000, shared: 1500 },
  electrical: { exclusive: 3000, shared: 1500 },
  "security-systems": { exclusive: 3000, shared: 1500 },
};

/** London and the South East, used once that region is added. */
const londonSouthEastPrices: Prices = {
  extensions: { exclusive: 12000, shared: 6000 },
  "loft-conversions": { exclusive: 12000, shared: 6000 },
  "architecture-planning": { exclusive: 12000, shared: 6000 },
  "conservatory-roofs": { exclusive: 9000, shared: 4500 },
  "solar-battery": { exclusive: 9000, shared: 4500 },
  "heat-pumps": { exclusive: 8000, shared: 4000 },
  "air-conditioning": { exclusive: 8000, shared: 4000 },
  bathrooms: { exclusive: 9000, shared: 4500 },
  kitchens: { exclusive: 9000, shared: 4500 },
  roofing: { exclusive: 9000, shared: 4500 },
  "windows-doors": { exclusive: 6000, shared: 3000 },
  insulation: { exclusive: 6000, shared: 3000 },
  "gardens-driveways": { exclusive: 6000, shared: 3000 },
  flooring: { exclusive: 4000, shared: 2000 },
  "ev-charging": { exclusive: 4000, shared: 2000 },
  plumbing: { exclusive: 4000, shared: 2000 },
  electrical: { exclusive: 4000, shared: 2000 },
  "security-systems": { exclusive: 4000, shared: 2000 },
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
export const defaultLeadPrice = { shared: 3000, exclusive: 6000 };

/**
 * Non-urgent leads, where the homeowner plans the work in 3 to 6 months, are
 * discounted. Specialists can opt out of them per service (see skipLaterLeadsFor).
 */
export const laterLeadDiscountPercent = 25;
export const LATER_TIMESCALE = "3-6-months";

/** Suppliers' credit is held for this long after they choose to leave, in case they return. */
export const leaverCreditHoldMonths = 6;
