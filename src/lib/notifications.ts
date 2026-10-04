import { site } from "@/config/site";
import { vettingChecks } from "@/config/vetting";
import { formatMonthYear } from "@/lib/format";
import { SAVED_PROGRESS_MONTHS } from "@/lib/consent";
import type { Enquiry, SavedProgress, Specialist } from "@/lib/types";

export interface Email {
  to: string;
  subject: string;
  text: string;
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
  "Please note: this is a prototype. The specialist below is fictional demonstration data, not a real company.\n\n";

function checksBlock(s: Specialist): string {
  const lines = vettingChecks.map((def) => {
    const r = s.checks.find((c) => c.id === def.id);
    return `  ✓ ${def.title}: ${r?.notApplicableReason ?? r?.evidence ?? ""}`;
  });
  return `${lines.join("\n")}\n  Checks last confirmed: ${formatMonthYear(s.checksLastConfirmed)}`;
}

/** Sent to the homeowner first, so they know who will contact them and why. */
export function customerMatchEmail(e: Enquiry, s: Specialist, serviceName: string, origin: string): Email {
  return {
    to: e.contact.email,
    subject: `Your ${serviceName} specialist: ${s.name}`,
    text: `${s.isDemo ? DEMO_NOTE : ""}Hello ${e.contact.firstName},

Thanks for telling us about your ${serviceName.toLowerCase()} project. We've matched you with one vetted local specialist:

${s.name}
${checksBlock(s)}

Profile: ${origin}/specialists/${s.slug}

What happens next
1. We're passing your answers and contact details to ${s.name} now.
2. They'll contact you by phone or email to talk through your project.
3. Any quote is between you and them, and there's no obligation to go ahead.

No other company has been given your details.

Your answers
${e.summary.map((r) => `  ${r.label}: ${r.value}`).join("\n")}

If you'd rather not be contacted after all, reply to this email and we'll let ${s.name} know.

${site.name}
`,
  };
}

/** Sent to the specialist after the homeowner has been told who they are. */
export function specialistEnquiryEmail(e: Enquiry, s: Specialist, serviceName: string): Email {
  return {
    to: s.enquiryEmail,
    subject: `New ${serviceName} enquiry: ${e.postcode}`,
    text: `${s.isDemo ? DEMO_NOTE : ""}Hello ${s.name},

A homeowner has asked to be put in touch about ${serviceName.toLowerCase()}. We've told them to expect your call or email.

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
