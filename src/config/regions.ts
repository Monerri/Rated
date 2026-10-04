import type { Region } from "@/lib/types";

/**
 * Regions are data. Add a region here and attach it to services in
 * services.ts to open a new market.
 */
export const regions: Region[] = [
  {
    slug: "north-east-england",
    name: "North East England",
    postcodeAreas: [
      { code: "NE", places: "Newcastle, Northumberland" },
      { code: "DH", places: "Durham, Chester-le-Street" },
      { code: "SR", places: "Sunderland" },
      { code: "DL", places: "Darlington, Bishop Auckland" },
      { code: "TS", places: "Teesside, Hartlepool" },
    ],
  },
];

export const primaryRegion = regions[0];

export function getRegion(slug: string): Region | undefined {
  return regions.find((r) => r.slug === slug);
}
