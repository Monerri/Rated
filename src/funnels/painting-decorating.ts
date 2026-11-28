import type { Answers, FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const work = (a: Answers) => (Array.isArray(a.work) ? a.work : []);
const INSIDE = ["walls-ceilings", "woodwork", "wallpaper", "textured-ceiling"];
const SPRAYING = ["spray-kitchen", "spray-upvc"];

/** Which kinds of job the homeowner asked for (a decorator needs to take at least one). */
function kinds(a: Answers): string[] {
  const w = work(a);
  const out: string[] = [];
  if (w.some((x) => INSIDE.includes(x))) out.push("interior");
  if (w.includes("exterior")) out.push("exterior");
  if (w.some((x) => SPRAYING.includes(x))) out.push("spraying");
  return out;
}

export const paintingDecoratingFunnel: FunnelConfig = {
  serviceSlug: "painting-decorating",
  heading: "Painting & Decorating",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Some decorators only work indoors, and spraying is a specialist trade.
  leadTypes: {
    options: [
      { value: "interior", label: "Inside the home" },
      { value: "exterior", label: "Outside the home" },
      { value: "spraying", label: "Spraying kitchens, uPVC or doors" },
    ],
    of: kinds,
  },
  questions: [
    {
      id: "work",
      type: "multi",
      title: "What would you like done?",
      hint: "Choose all that apply.",
      summaryLabel: "Work",
      layout: "list",
      options: [
        { value: "walls-ceilings", label: "Painting walls and ceilings" },
        { value: "woodwork", label: "Painting woodwork", hint: "Doors, skirting, banisters or window frames" },
        { value: "wallpaper", label: "Wallpapering" },
        { value: "textured-ceiling", label: "Covering or removing a textured ceiling", hint: "For example Artex" },
        { value: "exterior", label: "Painting outside", hint: "Walls, render, fascias or woodwork" },
        { value: "spray-kitchen", label: "Spraying kitchen cupboards" },
        { value: "spray-upvc", label: "Spraying uPVC windows or doors" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && v.includes("textured-ceiling"),
        text: "Textured coatings such as Artex applied before 2000 can contain a small amount of asbestos. It's safe left alone, but shouldn't be sanded or scraped until it's been tested. Your specialist can arrange this.",
      },
    },
    postcodeQuestion,
    {
      id: "rooms",
      type: "single",
      title: "How much of the inside?",
      summaryLabel: "Rooms",
      layout: "list",
      showIf: (a) => work(a).some((x) => INSIDE.includes(x)),
      options: [
        { value: "1-2", label: "One or two rooms" },
        { value: "3-5", label: "Three to five rooms" },
        { value: "whole", label: "The whole home" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
