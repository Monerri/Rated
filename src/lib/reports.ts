import { site } from "@/config/site";
import { specialists } from "@/data/specialists";
import { getService } from "@/config/services";
import { formatPence } from "@/lib/billing";
import { bindings } from "@/lib/cloudflare";
import { recordStore } from "@/lib/records";
import { trySend, type Email } from "@/lib/notifications";
import { summariseFeedback } from "@/lib/feedback";
import { demoStillOn, listingStatuses, type ListingStatus } from "@/lib/listing";
import type { Enquiry, LedgerEntry, MissedLead, Specialist } from "@/lib/types";

/** Where an enquiry came from, for measuring adverts: the campaign tags if any, else the referring site. */
export function sourceLabel(e: Pick<Enquiry, "source">): string {
  const { utm, referrer } = e.source;
  if (utm.source) return [utm.source, utm.medium, utm.campaign].filter(Boolean).join(" / ");
  if (referrer) {
    try {
      return new URL(referrer).hostname.replace(/^www\./, "");
    } catch {
      return "other";
    }
  }
  return "direct or unknown";
}

const DAY = 24 * 60 * 60 * 1000;

function sum(entries: LedgerEntry[], kind: LedgerEntry["kind"]) {
  return entries.filter((e) => e.kind === kind).reduce((t, e) => t + e.amountPence, 0);
}

function dateOnly(iso: string) {
  return iso.slice(0, 10);
}

function supplierReport(
  s: Specialist,
  entries: LedgerEntry[],
  missed: MissedLead[],
  balance: number,
  status: ListingStatus | undefined,
  from: string,
  to: string,
): Email {
  const leads = entries.filter((e) => e.kind === "lead");
  const lines = leads.length
    ? leads.map((e) => `  ${dateOnly(e.createdAt)}  ${formatPence(-e.amountPence).padStart(8)}  ${e.note}`).join("\n")
    : "  None this week.";
  const other = entries.filter((e) => e.kind !== "lead");
  return {
    to: s.enquiryEmail,
    subject: `Your ${site.name} week: ${leads.length} lead${leads.length === 1 ? "" : "s"}`,
    text: `Hello ${s.name},

Here's your summary for ${from} to ${to}.

Leads received: ${leads.length}
Spent on leads: ${formatPence(-sum(entries, "lead"))}
${other.length ? `Top-ups and refunds: ${formatPence(other.reduce((t, e) => t + e.amountPence, 0))}\n` : ""}Leads missed because your balance was too low: ${missed.length}
Balance now: ${formatPence(balance)}
${listingLine(status)}

Leads
${lines}
${
  missed.length
    ? `
Missed
${missed.map((m) => `  ${dateOnly(m.createdAt)}  ${getService(m.serviceSlug)?.name ?? m.serviceSlug} in ${m.area}, ${formatPence(m.pricePence)}`).join("\n")}
`
    : ""
}
To top up, reply to this email or contact ${site.supplierApplicationsEmail}.

${site.name}
`,
  };
}

/**
 * Weekly summary for the last 7 days: one email to each real specialist,
 * and one overview to us. Demo specialists appear only in our overview.
 */
export async function sendWeeklyReports(now = new Date()): Promise<{ suppliers: number }> {
  const since = new Date(now.getTime() - 7 * DAY).toISOString();
  const from = dateOnly(since);
  const to = dateOnly(now.toISOString());
  const [entries, missed, balances, enquiries, feedback, statuses] = await Promise.all([
    recordStore.listLedger(since, 10_000),
    recordStore.listMissedLeads(since),
    recordStore.getBalances(),
    recordStore.listEnquiries(since, now.toISOString()),
    // Requests go out up to three weeks before they're answered, so look back further and filter by answer date.
    recordStore.listFeedback(new Date(now.getTime() - 37 * DAY).toISOString()),
    listingStatuses(),
  ]);

  let sent = 0;
  const rows: string[] = [];
  for (const s of specialists) {
    const mine = entries.filter((e) => e.supplierSlug === s.slug);
    const myMissed = missed.filter((m) => m.supplierSlug === s.slug);
    const balance = balances[s.slug] ?? 0;
    const leads = mine.filter((e) => e.kind === "lead").length;
    const st = statuses[s.slug];
    const state = st?.on ? "on" : st?.reason === "switched-off" ? "OFF (switched off)" : "OFF (low balance)";
    rows.push(
      `  ${s.name}${s.isDemo ? " (demo, never charged, so not counted)" : ""}: ${state}, ${leads} lead${leads === 1 ? "" : "s"}, ${formatPence(-sum(mine, "lead"))} spent, ${myMissed.length} missed, balance ${formatPence(balance)}`,
    );
    if (s.isDemo) continue;
    if (await trySend(supplierReport(s, mine, myMissed, balance, statuses[s.slug], from, to))) sent++;
  }

  const topups = sum(entries, "topup");
  const demoOn = demoStillOn(statuses);
  const reminder = demoOn.length
    ? `REMINDER: ${demoOn.length} demo compan${demoOn.length === 1 ? "y is" : "ies are"} still switched on. Switch them off on the admin page before you go live, so real homeowners are only introduced to real specialists.

`
    : "";
  await trySend({
    to: bindings().ADMIN_EMAIL ?? site.contactEmail,
    subject: `${site.name} weekly summary: ${from} to ${to}`,
    text: `${reminder}Leads sent: ${entries.filter((e) => e.kind === "lead").length}
Charged for leads: ${formatPence(-sum(entries, "lead"))}
Top-ups received: ${formatPence(topups)}
Refunds to balances: ${formatPence(sum(entries, "refund"))}
Leads missed because of low balances: ${missed.length}
Money held as specialists' credit: ${formatPence(Object.values(balances).reduce((t, b) => t + b, 0))}

By specialist
${rows.join("\n")}

Where enquiries came from (for judging adverts)
${bySource(enquiries, entries)}

Homeowner feedback this week
${feedbackLines(feedback.filter((f) => f.respondedAt && f.respondedAt >= since))}

Reports sent to ${sent} specialist${sent === 1 ? "" : "s"}.
`,
  });
  return { suppliers: sent };
}

function listingLine(st: ListingStatus | undefined): string {
  if (!st || st.on) return "Your listing: on";
  if (st.reason === "low-balance") {
    return `Your listing: paused, because your balance is below your cheapest lead (${formatPence(st.minimumFeePence ?? 0)}). It switches back on when you top up.`;
  }
  return `Your listing: switched off. Contact ${site.supplierApplicationsEmail} if you'd like it switched back on.`;
}

/** Enquiries and money charged for them, grouped by where the homeowner came from. */
function bySource(enquiries: Enquiry[], entries: LedgerEntry[]): string {
  if (enquiries.length === 0) return "  No enquiries this week.";
  const charged = new Map<string, number>();
  for (const e of entries) if (e.kind === "lead" && e.enquiryId) charged.set(e.enquiryId, (charged.get(e.enquiryId) ?? 0) - e.amountPence);
  const groups = new Map<string, { count: number; pence: number }>();
  for (const e of enquiries) {
    const g = groups.get(sourceLabel(e)) ?? { count: 0, pence: 0 };
    g.count++;
    g.pence += charged.get(e.id) ?? 0;
    groups.set(sourceLabel(e), g);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([label, g]) => `  ${label}: ${g.count} enquir${g.count === 1 ? "y" : "ies"}, ${formatPence(g.pence)} charged`)
    .join("\n");
}

function feedbackLines(records: Parameters<typeof summariseFeedback>[0]): string {
  const summary = Object.entries(summariseFeedback(records));
  if (summary.length === 0) return "  None this week.";
  return summary
    .map(([slug, s]) => {
      const name = specialists.find((x) => x.slug === slug)?.name ?? slug;
      const avg = s.ratings.length ? (s.ratings.reduce((t, n) => t + n, 0) / s.ratings.length).toFixed(1) : "no ratings";
      return `  ${name}: ${s.responses} answer${s.responses === 1 ? "" : "s"}, average ${avg}${s.notContacted ? `, ${s.notContacted} never contacted` : ""}`;
    })
    .join("\n");
}
