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

/** "1st. January", or "31st. January 2027" with the year. UK dates (the deadlines are midnight in winter, so UTC is UK time). */
export function ordinalDate(iso: string, withYear = false): string {
  const d = new Date(iso);
  return `${ordinal(d.getUTCDate())} ${ORDINAL_MONTHS[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
}
