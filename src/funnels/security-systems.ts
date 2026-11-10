import type { FunnelConfig } from "@/funnels/types";
import {
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const securitySystemsFunnel: FunnelConfig = {
  serviceSlug: "security-systems",
  heading: "Security Systems",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "systems",
      type: "multi",
      title: "What are you looking for?",
      hint: "Choose all that apply.",
      summaryLabel: "Looking for",
      layout: "list",
      options: [
        { value: "alarm", label: "A burglar alarm" },
        { value: "cctv", label: "CCTV cameras" },
        { value: "doorbell", label: "A video doorbell" },
        { value: "lighting", label: "Security lighting" },
        { value: "smart", label: "Smart locks or app control" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && (v.includes("cctv") || v.includes("doorbell")),
        text: "If a camera records beyond your property, for example the street or a neighbour's garden, data protection law applies to you. The ICO's guidance for domestic CCTV explains what to do. A good installer will help you position cameras to avoid it.",
      },
    },
    postcodeQuestion,
    {
      id: "monitoring",
      type: "single",
      title: "What should happen when the alarm goes off?",
      summaryLabel: "Alarm response",
      layout: "list",
      showIf: (a) => Array.isArray(a.systems) && a.systems.includes("alarm"),
      options: [
        { value: "bells", label: "Just sound the alarm" },
        { value: "app", label: "Alert me on my phone" },
        { value: "monitored", label: "Alert a monitoring centre" },
        { value: "police", label: "A police response", hint: "The police are called when an alarm is confirmed" },
        { value: "not-sure", label: "Not sure, I'd like advice" },
      ],
      goodToKnow: {
        when: (v) => v === "police",
        text: "For a police response, the alarm must be fitted by an installer approved by NSI or SSAIB, and usually comes with a monitoring contract.",
      },
    },
    {
      id: "existing",
      type: "single",
      title: "Is there a system already?",
      summaryLabel: "Existing system",
      options: [
        { value: "no", label: "No" },
        { value: "replace", label: "Yes, to replace" },
        { value: "extend", label: "Yes, to add to" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
