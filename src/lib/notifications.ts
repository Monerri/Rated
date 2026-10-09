import { site } from "@/config/site";
import { vettingChecks } from "@/config/vetting";
import { formatMonthYear } from "@/lib/format";
import { numberWord, SAVED_PROGRESS_MONTHS } from "@/lib/consent";
import type { Enquiry, InterestRegistration, SavedProgress, Specialist, SupplierApplication } from "@/lib/types";

export interface Email {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/** Delivery boundary. Swap the prototype sender for a provider (for example Resend or Postmark) here. */
export interface EmailSender {
  send(email: Email): Promise<void>;
}

/** Prototype sender: logs the email instead of sending it. The address is redacted. */
const prototypeSender: EmailSender = {
  async send(email) {
    console.info(`[prototype] email not sent\nTo: [redacted]\nSubject: ${email.subject}\n\n${email.text}\n`);
  },
};

export const emailSender: EmailSender = prototypeSender;

const DEMO_NOTE =
  "Please note: this is a prototype. The specialists below are fictional demonstration data, not real companies.\n\n";

function checksBlock(s: Specialist): string {
  const lines = vettingChecks.map((def) => {
    const r = s.checks.find((c) => c.id === def.id);
    if (r && !r.passed && r.notApplicableReason) return `  – ${def.title}: ${r.notApplicableReason}`;
    return `  ✓ ${def.title}: ${r?.evidence ?? ""}`;
  });
  return `${lines.join("\n")}\n  Checks last confirmed: ${formatMonthYear(s.checksLastConfirmed)}`;
}

/** Sent to the homeowner first, so they know who will contact them and why. */
export function customerMatchEmail(e: Enquiry, specialists: Specialist[], serviceName: string, origin: string): Email {
  const n = specialists.length;
  const names = specialists.map((s) => s.name);
  const nameList = n === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[n - 1]}`;
  const demo = specialists.some((s) => s.isDemo);
  const fewer =
    n < e.specialistsRequested
      ? `You asked to hear from ${numberWord(e.specialistsRequested)}. Right now ${numberWord(n)} vetted ${n === 1 ? "specialist covers" : "specialists cover"} your area, so we've introduced ${n === 1 ? "them" : "all of them"}.\n\n`
      : "";
  const blocks = specialists
    .map((s) => `${s.name}\n${checksBlock(s)}\n  Profile: ${origin}/specialists/${s.slug}`)
    .join("\n\n");
  return {
    to: e.contact.email,
    subject: n === 1 ? `Your ${serviceName} specialist: ${names[0]}` : `Your ${n} ${serviceName} specialists`,
    text: `${demo ? DEMO_NOTE : ""}Hello ${e.contact.firstName},

Thanks for telling us about your ${serviceName.toLowerCase()} project. We've matched you with ${n === 1 ? "one vetted local specialist" : `${numberWord(n)} vetted local specialists`}:

${blocks}

${fewer}What happens next
1. We're passing your answers and contact details to ${nameList} now.
2. ${n === 1 ? "They'll" : "Each will"} contact you ${site.specialistResponseTime} by phone or email to talk through your project.
3. Any quote is between you and them, and there's no obligation to go ahead.

No other company has been given your details.

Your answers
${e.summary.map((r) => `  ${r.label}: ${r.value}`).join("\n")}

If you'd rather not be contacted after all, reply to this email and we'll let ${n === 1 ? "them" : "them all"} know.

${site.name}
`,
  };
}

/** Sent to each specialist after the homeowner has been told who they are. */
export function specialistEnquiryEmail(e: Enquiry, s: Specialist, introduced: number, serviceName: string): Email {
  const shared =
    introduced === 1
      ? "You're the only specialist we've introduced for this enquiry."
      : `The homeowner chose to hear from ${numberWord(e.specialistsRequested)} specialists. We've introduced ${numberWord(introduced)}, including you.`;
  return {
    to: s.enquiryEmail,
    subject: `New ${serviceName} enquiry: ${e.postcode}`,
    text: `${s.isDemo ? DEMO_NOTE : ""}Hello ${s.name},

A homeowner has asked to be put in touch about ${serviceName.toLowerCase()}. We've told them to expect your call or email. ${shared}

Name: ${e.contact.firstName} ${e.contact.lastName}
Phone: ${e.contact.phone}
Email: ${e.contact.email}
Postcode: ${e.postcode}

Their answers
${e.summary.map((r) => `  ${r.label}: ${r.value}`).join("\n")}

Enquiry reference: ${e.id}

${site.name}
`,
  };
}

/** Sent to someone who saved their progress, with links to resume or delete it. */
export function savedProgressEmail(p: SavedProgress, serviceName: string, origin: string): Email {
  const link = `${origin}/saved/${p.token}`;
  return {
    to: p.email,
    subject: `Your saved ${serviceName} answers`,
    text: `Hello,

We've saved your ${serviceName.toLowerCase()} answers. We haven't shared them with anyone.

Carry on when you're ready, or delete your answers, here:
${link}

We'll delete them automatically after ${SAVED_PROGRESS_MONTHS} months.

${site.name}
`,
  };
}

function unsubscribeLine(r: InterestRegistration, origin: string) {
  return `Don't want this email? Unsubscribe here: ${origin}/unsubscribe/${r.token}`;
}

/** Confirms a register-interest request, with a way to undo it. */
export function interestConfirmationEmail(r: InterestRegistration, serviceName: string, origin: string): Email {
  return {
    to: r.email,
    subject: `We'll let you know when ${serviceName} is available`,
    text: `Hello ${r.firstName},

Thanks for registering your interest in ${serviceName}. We'll send you one email when it becomes available in your area.

This isn't an enquiry, and no company has been given your details.

${unsubscribeLine(r, origin)}

${site.name}
`,
  };
}

/** The single email a register-interest consent covers. */
export function serviceAvailableEmail(
  r: InterestRegistration,
  serviceName: string,
  serviceSlug: string,
  regionName: string,
  origin: string,
): Email {
  return {
    to: r.email,
    subject: `${serviceName} is now available in your area`,
    text: `Hello ${r.firstName},

You asked us to let you know when ${serviceName} became available in your area. It's now available across ${regionName}.

If you'd like to be matched with a vetted local specialist, it takes about two minutes:
${origin}/find-a-specialist/${serviceSlug}

This is the only email we'll send you about it. We won't contact you again unless you start an enquiry.

${site.name}
`,
  };
}

/** Acknowledges a supplier application. Makes no promise of acceptance. */
export function supplierAcknowledgementEmail(a: SupplierApplication): Email {
  return {
    to: a.email,
    subject: `We've received your details: ${a.companyName}`,
    text: `Hello ${a.contactName},

Thanks for your interest in joining the ${site.name} network. We've received your details and will review your business against our current requirements:

${vettingChecks.map((c) => `  - ${c.title}`).join("\n")}

If your business looks like a good fit, we'll be in touch to talk about next steps. We review every application, but we can't accept every business.

Reference: ${a.id}

${site.name}
`,
  };
}

/** Internal notification so the team can start the review. */
export function supplierApplicationInternalEmail(a: SupplierApplication, serviceName: string): Email {
  return {
    to: site.supplierApplicationsEmail,
    subject: `New supplier application: ${a.companyName}`,
    text: `Company: ${a.companyName}
Companies House: ${a.companiesHouseNumber} (https://find-and-update.company-information.service.gov.uk/company/${a.companiesHouseNumber})
Contact: ${a.contactName}, ${a.phone}, ${a.email}
Website: ${a.website ?? "not given"}
Main service: ${serviceName}
Areas: ${[...a.areasCovered, a.otherAreas].filter(Boolean).join(", ")}
Competent Person Scheme: ${a.competentPersonScheme}
Insurance-backed guarantee provider: ${a.insuranceBackedGuaranteeProvider}
Google profile: ${a.googleProfileUrl}

About the business:
${a.description}

Anything else:
${a.anythingElse ?? "Nothing"}

Reference: ${a.id}
`,
  };
}

export const contactTopics = [
  { value: "question", label: "A question about the service" },
  { value: "enquiry", label: "An enquiry I've made" },
  { value: "specialist", label: "A specialist you introduced" },
  { value: "privacy", label: "My personal information" },
  { value: "supplier", label: "Joining the network" },
  { value: "other", label: "Something else" },
];

/** A message from the contact form, sent to the team inbox. */
export function contactMessageEmail(m: { name: string; email: string; topic: string; message: string }): Email {
  const topic = contactTopics.find((t) => t.value === m.topic)?.label ?? m.topic;
  return {
    to: site.contactEmail,
    replyTo: m.email,
    subject: `Contact form: ${topic}`,
    text: `From: ${m.name} <${m.email}>
Topic: ${topic}

${m.message}
`,
  };
}
