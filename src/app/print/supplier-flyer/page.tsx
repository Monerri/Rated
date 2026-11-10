import type { Metadata } from "next";
import qrcode from "qrcode-generator";
import { launch } from "@/config/launch";
import { primaryRegion } from "@/config/regions";
import { site } from "@/config/site";
import { vettingChecks } from "@/config/vetting";
import { LogoMark } from "@/components/ui/Logo";
import { FlyerControls } from "@/components/suppliers/FlyerControls";

export const metadata: Metadata = {
  title: "Supplier flyer",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ source?: string }> };

/** Where the flyer is handed out, as a tidy tag: "Jewson Durham" becomes "jewson-durham". */
function tag(input: string | undefined): string {
  return (input ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "flyer";
}

/**
 * A one-page A4 flyer for trade counters and meetings. The QR code links to
 * the For suppliers page, tagged with where the flyer was left
 * (?source=jewson-durham), so applications show which flyers work.
 */
export default async function SupplierFlyerPage({ searchParams }: Props) {
  const source = tag((await searchParams).source);
  const link = `${site.url}/for-suppliers?utm_source=${source}&utm_medium=flyer&utm_campaign=founding`;
  const qr = qrcode(0, "M");
  qr.addData(link);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
  const founding = launch.onboardingPhase && launch.foundingCredits > 0;

  return (
    <div className="mx-auto grid max-w-[210mm] gap-6 px-4 py-8 print:p-0">
      <FlyerControls source={source} link={link} siteUrl={site.url} />

      <article
        className="grid gap-6 rounded-[var(--radius-panel)] border border-line bg-surface p-8 text-ink print:rounded-none print:border-0 print:p-0"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <header className="flex items-center gap-3">
          <LogoMark className="h-12 w-auto" />
          <span className="font-serif text-[28px] font-semibold">{site.name}</span>
        </header>

        <div className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">For home-improvement specialists</p>
          <h1 className="text-[40px] font-extrabold leading-[1.05]">Get introductions to homeowners across {primaryRegion.name}</h1>
          <p className="text-lg text-muted">
            Homeowners tell us about their project and choose to hear from up to three checked local specialists. We
            introduce businesses that pass our checks.
          </p>
        </div>

        {founding && (
          <div className="grid gap-2 rounded-[var(--radius-card)] border-2 border-ink bg-ground p-5">
            <p className="font-serif text-[26px] font-bold leading-tight">
              Founding specialists: {launch.foundingCredits} free credits
            </p>
            <p className="text-[15px]">
              Join before we start advertising to homeowners in {launch.advertisingFrom} and get {launch.foundingCredits} free
              credits, worth £{launch.foundingCredits} of introductions. Any introductions before then are free too.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <div className="grid content-start gap-2">
            <h2 className="text-xl font-bold">How it works</h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-[15px]">
              <li>No membership fee and no bidding.</li>
              <li>You only pay when we introduce you. One credit is worth £1.</li>
              <li>Never more than three specialists per homeowner, and the homeowner chooses how many.</li>
              <li>Every homeowner has asked to hear from you and owns the property.</li>
              <li>Homeowners see your checks before you get in touch.</li>
            </ul>
          </div>
          <div className="grid content-start gap-2">
            <h2 className="text-xl font-bold">What we check</h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-[15px]">
              {vettingChecks.map((c) => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid items-center gap-5 rounded-[var(--radius-card)] border border-line p-5 sm:grid-cols-[150px_1fr] print:grid-cols-[150px_1fr]">
          <div className="size-[150px]" aria-label="QR code for our For suppliers page" role="img" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="grid gap-1">
            <p className="text-xl font-bold">Apply in about five minutes</p>
            <p className="text-[15px]">Scan the code, or go to</p>
            <p className="font-mono text-[15px] font-semibold">{site.domain}/for-suppliers</p>
            <p className="text-[15px]">Questions: {site.supplierApplicationsEmail}</p>
          </div>
        </div>

        <p className="text-[11px] text-muted">
          {site.name} is a trading name of {site.legal.companyName}, registered in {site.legal.placeOfRegistration}, company
          no. {site.legal.companyNumber}. Registered office: {site.legal.registeredOffice}. Terms apply: {site.domain}/supplier-terms.
        </p>
      </article>
    </div>
  );
}
