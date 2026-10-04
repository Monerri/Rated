/** "2026-09-01" -> "September 2026" */
export function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
