import type { FunnelConfig } from "@/funnels/types";
import {
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const electricalFunnel: FunnelConfig = {
  serviceSlug: "electrical",
  heading: "Electrical",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "work",
      type: "multi",
      title: "What do you need?",
      hint: "Choose all that apply.",
      summaryLabel: "Work",
      layout: "list",
      options: [
        { value: "rewire", label: "A full or partial rewire" },
        { value: "consumer-unit", label: "A new fuse box", hint: "Also called a consumer unit" },
        { value: "sockets-lighting", label: "Extra sockets or new lighting" },
        { value: "outdoor", label: "Outdoor power or lighting" },
        { value: "eicr", label: "A safety check", hint: "An Electrical Installation Condition Report (EICR)" },
        { value: "fault", label: "Finding and fixing a fault" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && (v.includes("rewire") || v.includes("consumer-unit") || v.includes("outdoor")),
        text: "In England, work like a rewire, a new fuse box or a new circuit must meet Building Regulations. A registered electrician can certify it themselves and give you a certificate when they finish. Keep it, as you'll need it if you sell.",
      },
    },
    postcodeQuestion,
    {
      id: "wiringAge",
      type: "single",
      title: "Roughly when was the wiring last updated?",
      summaryLabel: "Wiring last updated",
      layout: "list",
      options: [
        { value: "under-10", label: "In the last 10 years" },
        { value: "10-25", label: "10 to 25 years ago" },
        { value: "over-25", label: "More than 25 years ago" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "over-25" || v === "not-sure",
        text: "A safety check (EICR) is a good first step for older wiring. It's usually recommended at least every 10 years in a home you own.",
      },
    },
    {
      id: "occupied",
      type: "single",
      title: "Will you be living in the home while the work is done?",
      summaryLabel: "Living in during work",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
