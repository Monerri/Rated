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
    summary: "Replacement windows, front and back doors, French, sliding patio and bi-fold doors.",
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
    summary: "Single, two and three-storey extensions, and new houses built on your own plot.",
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
    slug: "insulation",
    name: "Insulation",
    summary: "Loft, cavity wall and other insulation.",
    icon: "insulation",
    status: "live",
    regions: ["north-east-england"],
  },
];

const comingSoon = (slug: string, name: string, summary: string, icon: Service["icon"]): Service => ({
  slug,
  name,
  summary,
  icon,
  status: "coming_soon",
  regions: [],
});

/** Not yet live: people can register interest and be told when they launch. */
services.push(
  comingSoon("loft-conversions", "Loft Conversions", "Turn your loft into a bedroom, office or extra living space.", "loft"),
  comingSoon("architecture-planning", "Architects & Planning", "Drawings, planning applications and Building Regulations plans.", "architecture"),
  comingSoon("kitchens", "Kitchens", "New fitted kitchens, from design to installation.", "kitchen"),
  comingSoon("bathrooms", "Bathrooms", "New bathrooms, en suites and wet rooms.", "bathroom"),
  comingSoon("gardens-driveways", "Gardens, Driveways & Landscaping", "Driveways, patios, fencing and garden landscaping.", "garden"),
  comingSoon("flooring", "Flooring", "Wood, laminate, vinyl, tiles and carpets, supplied and fitted.", "flooring"),
  comingSoon("plumbing", "Plumbing", "Plumbing repairs and installations around the home.", "plumbing"),
  comingSoon("electrical", "Electrical", "Rewiring, new circuits, consumer units and electrical repairs.", "electrical"),
  comingSoon("security-systems", "Security Systems", "Burglar alarms, CCTV, smart doorbells and security lighting.", "security"),
);

/**
 * Looks up a service's definition (name, icon, summary). For whether it is
 * live right now, use getCatalogueService in lib/catalogue.ts instead.
 */
export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
