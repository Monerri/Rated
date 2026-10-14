import { site } from "@/config/site";
import { specialists } from "@/data/specialists";
import { getService } from "@/config/services";
import { formatPence } from "@/lib/billing";
import { bindings } from "@/lib/cloudflare";
import { recordStore } from "@/lib/records";
import { trySend, type Email } from "@/lib/notifications";
import type { LedgerEntry, MissedLead, Specialist } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

function sum(entries: LedgerEntry[], kind: LedgerEntry["kind"]) {
  return entries.filter((e) => e.kind === kind).reduce((t, e) => t + e.amountPence, 0);
}

function dateOnly(iso: string) {
  return iso.slice(0, 10);
}

function supplierReport(s: Specialist, entries: LedgerEntry[], missed: MissedLead[], balance: number, from: string, to: string): Email {
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
  const [entries, missed, balances] = await Promise.all([
    recordStore.listLedger(since, 10_000),
    recordStore.listMissedLeads(since),
    recordStore.getBalances(),
  ]);

  let sent = 0;
  const rows: string[] = [];
  for (const s of specialists) {
    const mine = entries.filter((e) => e.supplierSlug === s.slug);
    const myMissed = missed.filter((m) => m.supplierSlug === s.slug);
    const balance = balances[s.slug] ?? 0;
    const leads = mine.filter((e) => e.kind === "lead").length;
    rows.push(
      `  ${s.name}${s.isDemo ? " (demo, never charged, so not counted)" : ""}: ${leads} lead${leads === 1 ? "" : "s"}, ${formatPence(-sum(mine, "lead"))} spent, ${myMissed.length} missed, balance ${formatPence(balance)}`,
    );
    if (s.isDemo) continue;
    if (await trySend(supplierReport(s, mine, myMissed, balance, from, to))) sent++;
  }

  const topups = sum(entries, "topup");
  await trySend({
    to: bindings().ADMIN_EMAIL ?? site.contactEmail,
    subject: `${site.name} weekly summary: ${from} to ${to}`,
    text: `Leads sent: ${entries.filter((e) => e.kind === "lead").length}
Charged for leads: ${formatPence(-sum(entries, "lead"))}
Top-ups received: ${formatPence(topups)}
Refunds to balances: ${formatPence(sum(entries, "refund"))}
Leads missed because of low balances: ${missed.length}
Money held as specialists' credit: ${formatPence(Object.values(balances).reduce((t, b) => t + b, 0))}

By specialist
${rows.join("\n")}

Reports sent to ${sent} specialist${sent === 1 ? "" : "s"}.
`,
  });
  return { suppliers: sent };
}
