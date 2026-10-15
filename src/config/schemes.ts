/**
 * Trade schemes and registers we check, by service. Shown on the How we check
 * page. Scheme names only, never logos: displaying a scheme's trust mark
 * without its permission is a banned practice under consumer law, and it
 * could suggest the scheme endorses us.
 *
 * Levels:
 * - "law": the law requires it for this work (for example Gas Safe for gas work).
 * - "required": we require it before introducing a specialist for this work.
 * - "where-relevant": we check it where the job calls for it.
 *
 * Sources (checked October 2026): GOV.UK list of competent person schemes
 * (updated 17 September 2026); HSE on Gas Safe registration (Gas Safety
 * (Installation and Use) Regulations 1998, regulation 3); GOV.UK on F gas
 * company certification; the Architects Act 1997 (protected title).
 */

export interface Scheme {
  name: string;
  /** Where a homeowner can check a business is registered. Official sites only. */
  url?: string;
}

export const schemes = {
  gasSafe: { name: "Gas Safe Register", url: "https://www.gassaferegister.co.uk" },
  fensa: { name: "FENSA", url: "https://www.fensa.org.uk" },
  certass: { name: "Certass", url: "https://www.certass.co.uk" },
  assure: { name: "Assure Certification" },
  electrical: {
    name: "A government-authorised electrical scheme, such as NICEIC or NAPIT",
    url: "https://www.electricalcompetentperson.co.uk",
  },
  mcs: { name: "MCS (Microgeneration Certification Scheme)", url: "https://mcscertified.com" },
  fGas: { name: "F gas company certification (Refcom, F-Gas Register or Bureau Veritas)", url: "https://www.refcom.org.uk" },
  competentRoofer: { name: "Competent Roofer", url: "https://www.competentroofer.co.uk" },
  oftec: { name: "OFTEC", url: "https://www.oftec.org" },
  hetas: { name: "HETAS", url: "https://www.hetas.co.uk" },
  aphc: { name: "APHC", url: "https://www.aphc.co.uk" },
  trustMark: { name: "TrustMark", url: "https://www.trustmark.org.uk" },
  iaa: { name: "Installation Assurance Authority (formerly CIGA)" },
  arb: { name: "Architects Registration Board", url: "https://arb.org.uk" },
  nsi: { name: "NSI", url: "https://www.nsi.org.uk" },
  ssaib: { name: "SSAIB", url: "https://www.ssaib.org" },
} satisfies Record<string, Scheme>;

export type SchemeLevel = "law" | "required" | "where-relevant";

export interface SchemeRequirement {
  level: SchemeLevel;
  /** Any one of these satisfies the requirement. */
  anyOf: Scheme[];
  /** What it covers, in plain words. */
  covers: string;
}

export interface ServiceSchemes {
  requirements: SchemeRequirement[];
  /** Shown when no scheme applies, or to add context. */
  note?: string;
}

export const schemeLevelLabels: Record<SchemeLevel, { symbol: string; label: string }> = {
  law: { symbol: "⚖", label: "Required by law" },
  required: { symbol: "✓", label: "We require" },
  "where-relevant": { symbol: "○", label: "Where the job needs it" },
};

const GAS_IN_JOB: SchemeRequirement = {
  level: "law",
  anyOf: [schemes.gasSafe],
  covers: "Any gas work, such as fitting or moving a gas hob, boiler or pipework.",
};
const ELECTRICS_IN_JOB: SchemeRequirement = {
  level: "where-relevant",
  anyOf: [schemes.electrical],
  covers: "Electrical work that must meet Building Regulations, such as new circuits or work near a bath or shower.",
};
const BUILDING_CONTROL =
  "Building work like this is approved by your council's building control or a registered building control approver, not a trade scheme. Any gas or electrical work in the project still needs a Gas Safe registered engineer or a registered electrician.";

export const serviceSchemes: Record<string, ServiceSchemes> = {
  "windows-doors": {
    requirements: [
      {
        level: "required",
        anyOf: [schemes.fensa, schemes.certass, schemes.assure],
        covers: "Replacement windows and doors, so the installer can certify the work meets Building Regulations.",
      },
    ],
  },
  "conservatory-roofs": {
    requirements: [
      { level: "where-relevant", anyOf: [schemes.fensa, schemes.certass, schemes.assure], covers: "Glazed roofs." },
    ],
    note: "Replacing a glazed roof with a solid one usually needs Building Regulations approval from building control instead.",
  },
  extensions: { requirements: [GAS_IN_JOB], note: BUILDING_CONTROL },
  "loft-conversions": { requirements: [GAS_IN_JOB], note: BUILDING_CONTROL },
  "architecture-planning": {
    requirements: [
      {
        level: "law",
        anyOf: [schemes.arb],
        covers: "Anyone calling themselves an architect. Architectural technologists and planning consultants don't need to be registered.",
      },
    ],
  },
  roofing: {
    requirements: [
      {
        level: "where-relevant",
        anyOf: [schemes.competentRoofer],
        covers: "Re-roofing that needs Building Regulations approval. Otherwise building control approves the work.",
      },
    ],
  },
  "solar-battery": {
    requirements: [
      { level: "required", anyOf: [schemes.mcs], covers: "Solar panels and batteries. Usually needed to be paid for the electricity you export." },
      { level: "required", anyOf: [schemes.electrical], covers: "Connecting the system to your home's electrics." },
    ],
  },
  "heat-pumps": {
    requirements: [
      { level: "required", anyOf: [schemes.mcs], covers: "Heat pumps. Needed for the government's Boiler Upgrade Scheme grant." },
      {
        level: "law",
        anyOf: [schemes.fGas],
        covers: "Installing or servicing systems that involve handling refrigerant gas, such as split air conditioning.",
      },
      ELECTRICS_IN_JOB,
    ],
  },
  "ev-charging": {
    requirements: [{ level: "required", anyOf: [schemes.electrical], covers: "Fitting a charge point, which usually needs a new circuit." }],
  },
  insulation: {
    requirements: [
      { level: "where-relevant", anyOf: [schemes.iaa], covers: "Cavity wall insulation, which should come with an independent guarantee." },
      { level: "where-relevant", anyOf: [schemes.trustMark], covers: "Work paid for through a government-funded scheme." },
    ],
  },
  kitchens: { requirements: [GAS_IN_JOB, ELECTRICS_IN_JOB] },
  bathrooms: { requirements: [GAS_IN_JOB, ELECTRICS_IN_JOB] },
  plumbing: {
    requirements: [
      { level: "law", anyOf: [schemes.gasSafe], covers: "Gas boilers, gas fires, and any work on gas pipes or appliances." },
      { level: "where-relevant", anyOf: [schemes.oftec], covers: "Oil boilers and tanks." },
      { level: "where-relevant", anyOf: [schemes.hetas], covers: "Wood burners and other solid fuel appliances." },
      { level: "where-relevant", anyOf: [schemes.aphc], covers: "Plumbing and heating work that must meet Building Regulations." },
    ],
  },
  electrical: {
    requirements: [
      {
        level: "required",
        anyOf: [schemes.electrical],
        covers: "All electrical work, so the electrician can certify that work meets Building Regulations.",
      },
    ],
  },
  "security-systems": {
    requirements: [
      { level: "where-relevant", anyOf: [schemes.nsi, schemes.ssaib], covers: "Burglar alarms you'd like the police to respond to." },
      ELECTRICS_IN_JOB,
    ],
  },
  "gardens-driveways": {
    requirements: [],
    note: "No trade scheme applies. A new driveway in a front garden usually needs to drain into the garden or use a permeable surface to avoid needing planning permission.",
  },
  flooring: { requirements: [], note: "No trade scheme applies to fitting floors." },
};
