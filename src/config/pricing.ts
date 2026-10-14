/**
 * What a lead costs a specialist, in pence, excluding VAT.
 *
 * PLACEHOLDER PRICES: change them here. A change applies to leads sent after
 * the next deploy; leads already sent keep the price they were charged.
 *
 * - shared: the homeowner asked to hear from two or three specialists
 * - exclusive: the homeowner asked to hear from one specialist only
 */
export const leadPrices: Record<string, { shared: number; exclusive: number }> = {
  "windows-doors": { shared: 1500, exclusive: 2500 },
  "conservatory-roofs": { shared: 2000, exclusive: 3500 },
  extensions: { shared: 4000, exclusive: 7000 },
  roofing: { shared: 2500, exclusive: 4000 },
};

/**
 * Whether the prices above are final. While false, applicants are told we'll
 * send prices when we review their application, instead of being shown them.
 */
export const pricesConfirmed = false;

/** Used for any service not listed above. */
export const defaultLeadPrice = { shared: 2000, exclusive: 3500 };

/**
 * Leads where the homeowner plans the work in 3 to 6 months are discounted.
 * Specialists can opt out of them per service (see skipLaterLeadsFor).
 */
export const laterLeadDiscountPercent = 30;
export const LATER_TIMESCALE = "3-6-months";

/** Suppliers' credit is held for this long after they choose to leave, in case they return. */
export const leaverCreditHoldMonths = 6;
