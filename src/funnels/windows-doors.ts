import type { FunnelConfig } from "@/funnels/types";
import {
  fullPostcodeQuestion,
  listedQuestion,
  postcodeAreaQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

const wantsWindows = (a: Record<string, unknown>) => a.improve === "windows" || a.improve === "both";
const wantsDoors = (a: Record<string, unknown>) => a.improve === "doors" || a.improve === "both";

export const windowsDoorsFunnel: FunnelConfig = {
  serviceSlug: "windows-doors",
  heading: "Windows & Doors",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "improve",
      type: "single",
      title: "What are you looking to improve?",
      summaryLabel: "Looking to improve",
      options: [
        { value: "windows", label: "Windows", icon: "window" },
        { value: "doors", label: "Doors", icon: "door" },
        { value: "both", label: "Windows & doors", icon: "windows-doors" },
      ],
    },
    postcodeAreaQuestion,
    fullPostcodeQuestion,
    propertyTypeQuestion,
    {
      id: "windowCount",
      type: "single",
      title: "Roughly how many windows are you looking to replace?",
      summaryLabel: "Number of windows",
      showIf: wantsWindows,
      options: [
        { value: "1-3", label: "1 to 3" },
        { value: "4-6", label: "4 to 6" },
        { value: "7-10", label: "7 to 10" },
        { value: "11+", label: "11 or more" },
      ],
    },
    {
      id: "doorTypes",
      type: "multi",
      title: "Which doors are you looking to replace?",
      hint: "Choose all that apply.",
      summaryLabel: "Doors",
      showIf: wantsDoors,
      options: [
        { value: "front", label: "Front door", icon: "door" },
        { value: "back", label: "Back door", icon: "backdoor" },
        { value: "french", label: "French doors", icon: "french" },
        { value: "sliding", label: "Sliding patio doors", icon: "sliding" },
        { value: "bifold", label: "Bi-fold doors", icon: "bifold" },
        { value: "not-sure", label: "Not sure yet", icon: "unsure" },
      ],
    },
    {
      id: "currentGlazing",
      type: "single",
      title: "What windows do you currently have?",
      summaryLabel: "Current glazing",
      showIf: wantsWindows,
      options: [
        { value: "single", label: "Single glazing" },
        { value: "double", label: "Double glazing" },
        { value: "not-sure", label: "Not sure" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "priorities",
      type: "multi",
      title: "What's most important to you?",
      hint: "Choose up to three.",
      summaryLabel: "Most important",
      max: 3,
      layout: "list",
      options: [
        { value: "energy-bills", label: "Lower energy bills" },
        { value: "warmer", label: "Warmer rooms" },
        { value: "security", label: "Better security" },
        { value: "noise", label: "Less outside noise" },
        { value: "appearance", label: "Appearance" },
        { value: "replace-damaged", label: "Replacing old or damaged windows or doors" },
      ],
    },
    listedQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
