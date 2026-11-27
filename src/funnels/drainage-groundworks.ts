import type { Answers, FunnelConfig } from "@/funnels/types";
import { site } from "@/config/site";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const work = (a: Answers) => (Array.isArray(a.work) ? a.work : []);
const DRAINAGE = ["drain-problem", "drain-survey", "new-drain", "soakaway"];

/** Which kinds of job the homeowner asked for (a specialist needs to take at least one). */
function kinds(a: Answers): string[] {
  const w = work(a);
  const out: string[] = [];
  if (w.some((x) => DRAINAGE.includes(x))) out.push("drainage");
  if (w.includes("water-pipe")) out.push("water-pipes");
  if (w.includes("septic")) out.push("septic");
  if (w.includes("groundworks")) out.push("groundworks");
  return out;
}

export const drainageGroundworksFunnel: FunnelConfig = {
  serviceSlug: "drainage-groundworks",
  heading: "Drainage & Groundworks",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Drainage firms, water pipe contractors, septic tank installers and
  // groundworkers often only do one or two of these.
  leadTypes: {
    options: [
      { value: "drainage", label: "Drainage" },
      { value: "water-pipes", label: "Underground water pipes" },
      { value: "septic", label: "Septic tanks and treatment plants" },
      { value: "groundworks", label: "Groundworks" },
    ],
    of: kinds,
  },
  questions: [
    {
      id: "work",
      type: "multi",
      title: "What do you need?",
      hint: "Choose all that apply.",
      summaryLabel: "Work",
      layout: "list",
      options: [
        { value: "drain-problem", label: "A blocked, leaking or damaged drain" },
        { value: "drain-survey", label: "A drain survey", hint: "Usually with a camera" },
        { value: "new-drain", label: "New drains or a sewer connection" },
        { value: "soakaway", label: "A soakaway or garden drainage" },
        { value: "water-pipe", label: "An underground water pipe", hint: "Replacing a lead pipe, a leak or a new connection" },
        { value: "septic", label: "A septic tank or treatment plant" },
        { value: "groundworks", label: "Groundworks", hint: "Digging out, concrete bases, retaining walls or trenches" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && v.includes("drain-problem"),
        text: `We're not an emergency service: specialists get in touch ${site.specialistResponseTime}. If a drain is shared with neighbours or runs outside your boundary, it's usually your water company's responsibility, so call them first.`,
      },
    },
    postcodeQuestion,
    {
      id: "waterPipe",
      type: "single",
      title: "What's needed on the water pipe?",
      summaryLabel: "Water pipe",
      layout: "list",
      showIf: (a) => work(a).includes("water-pipe"),
      options: [
        { value: "replace", label: "Replace an old or lead pipe" },
        { value: "leak", label: "Fix a leak" },
        { value: "new", label: "A new water connection", hint: "For example for an extension or outbuilding" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: () => true,
        text: "Work on water supply pipes must meet the Water Fittings Regulations. An approved contractor, listed on the WaterSafe register, can certify that it does.",
      },
    },
    {
      id: "sewer",
      type: "single",
      title: "Is the home connected to the mains sewer?",
      summaryLabel: "Mains sewer",
      layout: "list",
      showIf: (a) => work(a).some((x) => ["drain-problem", "drain-survey", "new-drain", "septic"].includes(x)),
      options: [
        { value: "mains", label: "Yes, mains sewer" },
        { value: "septic", label: "No, a septic tank or treatment plant" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "septic",
        text: "Septic tanks and small sewage treatment plants in England must meet the Environment Agency's general binding rules. A specialist can tell you whether yours does.",
      },
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
