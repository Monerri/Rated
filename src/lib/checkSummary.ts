import { checkStatus } from "@/lib/vetting";
import type { PublicSpecialist, VettingCheckId } from "@/lib/types";

/**
 * The checks as homeowners see them on a specialist's card and in emails:
 * four rows, each with one short line of detail. Some rows combine checks
 * (identity with the registered business, legal registration with trade
 * schemes). How we check explains each check in full.
 */
export interface CheckRow {
  title: string;
  /** passed: every part passed or doesn't apply. not_required: none applies. partial: something isn't checked yet. */
  status: "passed" | "not_required" | "partial";
  /** One short line, for example "Companies House 01234567 · ID checked". */
  detail: string;
}

const strip = (evidence: string) =>
  evidence
    .replace(/^(Scheme|Provider): /, "")
    .replace(/, registration .*$/, "")
    .trim();

export function checkRows(s: PublicSpecialist): CheckRow[] {
  const st = (id: VettingCheckId) => checkStatus(s, id);
  const r = (id: VettingCheckId) => s.checks.find((c) => c.id === id);
  const ok = (id: VettingCheckId) => st(id) === "passed" || st(id) === "not_required" || (id === "legal_registration" && st(id) === "not_recorded");

  // 1. Registered business, including identity.
  const company = r("registered_company");
  const companyText = company?.soleTrader ? "Sole trader*" : (company?.evidence.replace("Companies House no. ", "Company ") ?? "");
  const business: CheckRow =
    st("registered_company") !== "passed"
      ? { title: "Registered business", status: "partial", detail: "Not checked" }
      : ok("identity")
        ? { title: "Registered business", status: "passed", detail: `${companyText} · ID checked` }
        : { title: "Registered business", status: "partial", detail: `${companyText} · ID not checked` };

  // 2. Legal registration (Gas Safe, F gas) and trade schemes.
  const names = (["legal_registration", "competent_person_scheme"] as const)
    .filter((id) => st(id) === "passed")
    .map((id) => strip(r(id)!.evidence));
  const registration: CheckRow =
    !ok("legal_registration") || !ok("competent_person_scheme")
      ? { title: "Trade or legal registration", status: "partial", detail: names.length ? `${names.join(" · ")} · not all checked` : "Not checked" }
      : names.length
        ? { title: "Trade or legal registration", status: "passed", detail: names.join(" · ") }
        : { title: "Trade or legal registration", status: "not_required", detail: "None needed for this work" };

  // 3. Insurance-backed guarantee. Without one, the business's own workmanship guarantee (as it told us) is shown instead.
  const ibg = st("insurance_backed_guarantee");
  const years = s.workmanshipGuaranteeYears;
  const own =
    years == null ? null : years === 0 ? "No written guarantee of its own" : `Own ${years}-year guarantee, not insurance-backed`;
  const guarantee: CheckRow =
    ibg === "passed"
      ? { title: "Insurance-backed guarantee", status: "passed", detail: strip(r("insurance_backed_guarantee")!.evidence) }
      : ibg === "not_required"
        ? { title: "Insurance-backed guarantee", status: "not_required", detail: years ? `Not needed · own ${years}-year guarantee` : "Not needed for this work" }
        : { title: "Insurance-backed guarantee", status: "partial", detail: own ?? "Not checked" };

  // 4. Google rating.
  const rating: CheckRow = {
    title: `${s.googleRating.toFixed(1)} ★ Google rating`,
    status: st("google_rating") === "passed" ? "passed" : "partial",
    detail: `${s.googleReviewCount} reviews`,
  };

  return [business, registration, guarantee, rating];
}
