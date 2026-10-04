import type { Service } from "@/lib/types";

/**
 * The service catalogue. Switching a service from coming soon to live is a
 * change to `status` and `regions` here (and, later, a row in the database),
 * plus a questionnaire configuration for the funnel.
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
    slug: "solar-battery",
    name: "Solar & Battery",
    summary: "Solar panels and home battery storage.",
    icon: "solar-battery",
    status: "coming_soon",
    regions: [],
  },
  {
    slug: "heat-pumps",
    name: "Heat Pumps",
    summary: "Air source heat pumps for heating and hot water.",
    icon: "heat-pump",
    status: "coming_soon",
    regions: [],
  },
  {
    slug: "ev-charging",
    name: "EV Charging",
    summary: "Home charge points for electric vehicles.",
    icon: "ev-charging",
    status: "coming_soon",
    regions: [],
  },
  {
    slug: "insulation",
    name: "Insulation",
    summary: "Loft, cavity wall and other insulation.",
    icon: "insulation",
    status: "coming_soon",
    regions: [],
  },
];

export const liveServices = services.filter((s) => s.status === "live");
export const comingSoonServices = services.filter((s) => s.status === "coming_soon");

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
