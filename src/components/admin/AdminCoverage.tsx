"use client";

import { useEffect, useState } from "react";

interface Coverage {
  towns: string[];
  rows: { service: string; counts: number[] }[];
  target: number;
  specialists: number;
}

/** Cell text: a number and a symbol, never colour alone. */
function cell(n: number, target: number): string {
  if (n === 0) return "–";
  return n >= target ? `✓ ${n}` : String(n);
}

/**
 * Where we have enough specialists to advertise: real, active specialists
 * per service and town. Recruit where the gaps are.
 */
export function AdminCoverage({ token }: { token: string }) {
  const [data, setData] = useState<Coverage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/coverage", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [token]);

  if (error) return <p>Couldn&apos;t load coverage.</p>;
  if (!data) return <p className="text-muted">Loading…</p>;

  return (
    <section aria-labelledby="coverage" className="grid min-w-0 gap-3">
      <h2 id="coverage" className="text-2xl font-bold">
        Coverage
      </h2>
      <p className="text-[15px] text-muted">
        How many real specialists could take a lead for each service in each town: they&apos;ve accepted the terms, their
        checks are current and they&apos;re not switched off. Demo companies aren&apos;t counted. ✓ means {data.target} or more,
        enough for homeowners to compare, so it&apos;s worth advertising that service there. – means nobody yet.
      </p>
      <p className="text-[15px] font-semibold">
        {data.specialists} real {data.specialists === 1 ? "specialist" : "specialists"} counted.
      </p>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">Specialists per service and town</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="sticky left-0 bg-surface p-2 font-semibold">
                Service
              </th>
              {data.towns.map((t) => (
                <th key={t} scope="col" className="p-2 text-center font-semibold">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.service} className="border-b border-line">
                <th scope="row" className="sticky left-0 bg-surface p-2 font-semibold">
                  {r.service}
                </th>
                {r.counts.map((n, i) => (
                  <td key={i} className={`p-2 text-center font-mono ${n >= data.target ? "font-bold" : "text-muted"}`}>
                    {cell(n, data.target)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        Towns are checked against each specialist&apos;s base and travel distance, using approximate town centres.
      </p>
      <p className="text-[15px]">
        Recruiting where there are gaps?{" "}
        <a href="/print/supplier-flyer" target="_blank" className="font-semibold text-blue underline">
          Print a supplier flyer with a tracked QR code (new tab)
        </a>
      </p>
    </section>
  );
}
