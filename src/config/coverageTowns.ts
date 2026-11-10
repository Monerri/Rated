/**
 * Places used for the coverage table on /admin: a few towns in each postcode
 * area, so a specialist's base and travel distance can be checked against
 * real locations. Positions are approximate town centres.
 */
export const coverageTowns: { name: string; area: string; outward: string; lat: number; lng: number }[] = [
  { name: "Newcastle", area: "NE", outward: "NE1", lat: 54.973, lng: -1.614 },
  { name: "Morpeth", area: "NE", outward: "NE61", lat: 55.168, lng: -1.688 },
  { name: "Hexham", area: "NE", outward: "NE46", lat: 54.971, lng: -2.101 },
  { name: "Alnwick", area: "NE", outward: "NE66", lat: 55.413, lng: -1.706 },
  { name: "Berwick", area: "TD", outward: "TD15", lat: 55.771, lng: -2.005 },
  { name: "Sunderland", area: "SR", outward: "SR1", lat: 54.906, lng: -1.383 },
  { name: "Durham", area: "DH", outward: "DH1", lat: 54.776, lng: -1.576 },
  { name: "Consett", area: "DH", outward: "DH8", lat: 54.851, lng: -1.833 },
  { name: "Bishop Auckland", area: "DL", outward: "DL14", lat: 54.664, lng: -1.677 },
  { name: "Darlington", area: "DL", outward: "DL1", lat: 54.524, lng: -1.553 },
  { name: "Hartlepool", area: "TS", outward: "TS24", lat: 54.69, lng: -1.21 },
  { name: "Middlesbrough", area: "TS", outward: "TS1", lat: 54.574, lng: -1.235 },
];

/** How many specialists per service and place before it's worth advertising there: enough to compare. */
export const coverageTarget = 2;
