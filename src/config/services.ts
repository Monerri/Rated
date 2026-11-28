import type { Service } from "@/lib/types";

/**
 * Service definitions and their default availability. Availability can be
 * changed at runtime without a rebuild (see lib/catalogue.ts and
 * /api/admin/services). A service needs a questionnaire in src/funnels
 * before it can go live.
 */
export const services: Service[] = [
  {
    slug: "windows-doors",
    name: "Windows & Doors",
    summary: "Replacement windows, front and back doors, French, sliding patio and bi-fold doors, and garage doors.",
    icon: "windows-doors",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "conservatory-roofs",
    name: "Conservatory Roofs",
    summary: "Replace a polycarbonate or glass roof to make the room comfortable all year.",
    icon: "conservatory-roof",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "extensions",
    name: "Extensions & New Builds",
    summary: "Single, two and three-storey extensions, new houses built on your own plot, and brickwork and pointing.",
    icon: "extension",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "roofing",
    name: "Roof Replacement",
    summary: "Re-roofing pitched and flat house roofs, from slipped tiles to a complete new roof.",
    icon: "roof",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "solar-battery",
    name: "Solar & Battery",
    summary: "Solar panels and home battery storage.",
    icon: "solar-battery",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "heat-pumps",
    name: "Heat Pumps & Air Conditioning",
    summary: "Air source heat pumps for heating and hot water, and air conditioning.",
    icon: "heat-pump",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "ev-charging",
    name: "EV Charging",
    summary: "Home charge points for electric vehicles.",
    icon: "ev-charging",
    status: "live",
    regions: ["north-east-england"],
  },
  {
    slug: "electrical",
    name: "Electrical",
    summary: "Rewiring, new circuits, consumer units and electrical repairs.",
    icon: "electrical",
    status: "live",
    regions: ["north-east-england"],
  },
];

/** Services added in the second wave, live across North East England. */
const live = (slug: string, name: string, summary: string, icon: Service["icon"]): Service => ({
  slug,
  name,
  summary,
  icon,
  status: "live",
  regions: ["north-east-england"],
});

/**
 * A service can also be "coming_soon", where people register interest and are
 * told when it launches. Set that here, or at runtime on /admin.
 */
services.push(
  live("loft-conversions", "Loft Conversions", "Turn your loft into a bedroom, office or extra living space.", "loft"),
  live("architecture-planning", "Architects & Planning", "Drawings, planning applications and Building Regulations plans.", "architecture"),
  live("kitchens", "Kitchens", "New fitted kitchens, from design to installation.", "kitchen"),
  live("bathrooms", "Bathrooms", "New bathrooms, en suites and wet rooms.", "bathroom"),
  live("gardens-driveways", "Gardens, Driveways & Landscaping", "Driveways, patios, fencing and garden landscaping.", "garden"),
  live("flooring", "Flooring", "Wood, laminate, vinyl, tiles and carpets, supplied and fitted.", "flooring"),
  live("plumbing", "Plumbing & Heating", "Boilers, radiators, central heating and plumbing installations and repairs.", "plumbing"),
  live("painting-decorating", "Painting & Decorating", "Painting inside and out, wallpapering, and spraying kitchens and uPVC.", "painting"),
  live("plastering", "Plastering & Rendering", "Skimming, re-plastering, ceilings, coving and external render.", "plastering"),
  live("carpentry-joinery", "Carpentry & Joinery", "Doors, staircases, skirting, fitted wardrobes and built-in storage.", "carpentry"),
  live("roofline", "Fascias, Soffits & Guttering", "New fascias, soffits, bargeboards, gutters and downpipes.", "roofline"),
  live("stoves", "Wood Burners & Stoves", "Wood burners, multi-fuel and gas stoves, flue liners and fireplaces.", "stove"),
  live("damp-proofing", "Damp Proofing", "Rising and penetrating damp, condensation, rot and cellar waterproofing.", "damp"),
  live("drainage-groundworks", "Drainage & Groundworks", "Drains, soakaways, underground water pipes, septic tanks and groundworks.", "drainage"),
  live("insulation", "Insulation", "Loft, cavity wall and other insulation.", "insulation"),
  live("security-systems", "Security Systems", "Burglar alarms, CCTV, smart doorbells and security lighting.", "security"),
);

/**
 * Looks up a service's definition (name, icon, summary). For whether it is
 * live right now, use getCatalogueService in lib/catalogue.ts instead.
 */
export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
