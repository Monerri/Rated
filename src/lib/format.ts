/** "2026-09-01" -> "September 2026" */
export function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

const ORDINAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "1st.", "2nd.", "3rd.", "31st.": the owner's preferred date style, with a full stop after the ordinal. */
export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${suffix}.`;
}

/** "1st. January", or "31st. January 2027" with the year: the owner's date style, in UK time. Use this for every date shown. */
export function ordinalDate(iso: string, withYear = false): string {
  // The date as it is in the UK, so a moment just after midnight in summer time isn't shown as the day before.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/London" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${ordinal(Number(parts.day))} ${ORDINAL_MONTHS[Number(parts.month) - 1]}${withYear ? ` ${parts.year}` : ""}`;
}

/** The time in the UK, for example "14:05". */
export function ukTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}
