/**
 * How specialists say where they work: a base postcode and a travel radius,
 * with optional postcodes to leave out (for example across a border where
 * different regulations apply). The cap stops a national firm claiming a
 * huge radius to collect every lead.
 */
export const maxRadiusMiles = 30;

/** The choices offered on the supplier form. */
export const radiusOptions = [5, 10, 15, 20, 25, 30].filter((m) => m <= maxRadiusMiles);
