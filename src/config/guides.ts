export interface Guide {
  slug: string;
  title: string;
  summary: string;
  /** Related service slug, used to link guides and services. */
  service: string;
  readingMinutes: number;
}

/** Guide index. Content pages are added in a later step. */
export const guides: Guide[] = [
  {
    slug: "choosing-new-windows",
    title: "Choosing new windows",
    summary: "Frame materials, glazing, opening styles and the questions to ask before you get a quote.",
    service: "windows-doors",
    readingMinutes: 6,
  },
  {
    slug: "window-energy-ratings",
    title: "Understanding window energy ratings",
    summary: "What the A++ to E labels and U-values mean, and how much difference they make in practice.",
    service: "windows-doors",
    readingMinutes: 5,
  },
  {
    slug: "conservatory-roof-replacement",
    title: "Conservatory roof replacement",
    summary: "Solid, glass and lightweight roofs compared, including when Building Regulations apply.",
    service: "conservatory-roofs",
    readingMinutes: 7,
  },
  {
    slug: "comfortable-conservatory",
    title: "Making a conservatory comfortable year-round",
    summary: "Why conservatories get too hot and too cold, and the options for fixing it.",
    service: "conservatory-roofs",
    readingMinutes: 5,
  },
  {
    slug: "solar-battery-basics",
    title: "Solar and battery basics",
    summary: "How panels and home batteries work together, and what affects whether they suit your home.",
    service: "solar-battery",
    readingMinutes: 6,
  },
  {
    slug: "heat-pump-basics",
    title: "Heat pump basics",
    summary: "How air source heat pumps work and what to check about your home first.",
    service: "heat-pumps",
    readingMinutes: 6,
  },
  {
    slug: "ev-charging-at-home",
    title: "EV charging at home",
    summary: "Charge point types, installation requirements and running costs.",
    service: "ev-charging",
    readingMinutes: 4,
  },
];
