import type { IconName } from "@/lib/types";

/** Line icons drawn on a 32px grid at 1.8px stroke (see design direction). */
const paths: Record<IconName, React.ReactNode> = {
  window: (
    <>
      <rect x="6" y="4" width="20" height="24" rx="1.5" />
      <path d="M16 4v24M6 14h20" />
      <rect x="9" y="17" width="4.5" height="8" rx=".5" />
      <path d="M18.5 19.5v3" />
    </>
  ),
  door: (
    <>
      <path d="M8 28V5.5A1.5 1.5 0 0 1 9.5 4h13A1.5 1.5 0 0 1 24 5.5V28M5 28h22" />
      <rect x="11.5" y="7.5" width="9" height="5" rx=".5" />
      <path d="M13 19h6M21 15.5v3M11.5 23h9" />
    </>
  ),
  backdoor: (
    <>
      <path d="M8 28V5.5A1.5 1.5 0 0 1 9.5 4h13A1.5 1.5 0 0 1 24 5.5V28M5 28h22" />
      <rect x="11" y="7" width="10" height="9" rx=".5" />
      <path d="M16 7v9M11 11.5h10M11 20h10v5H11zM21.5 18v2" />
    </>
  ),
  french: (
    <>
      <rect x="4" y="4" width="24" height="24" rx="1" />
      <path d="M16 4v24M2 28h28" />
      <rect x="7" y="7" width="6.5" height="18" rx=".5" />
      <rect x="18.5" y="7" width="6.5" height="18" rx=".5" />
      <path d="M14.8 15v2.5M17.2 15v2.5" />
    </>
  ),
  sliding: (
    <>
      <rect x="3" y="9" width="26" height="19" rx="1" />
      <rect x="5.5" y="11.5" width="11" height="14.5" rx=".5" />
      <rect x="15.5" y="11" width="11" height="15.5" rx=".5" />
      <path d="M12 4.5h9M18.5 2.5l2.5 2-2.5 2" />
    </>
  ),
  bifold: (
    <>
      <path d="M4 7l6 3 6-3 6 3 6-3M4 28l6-3 6 3 6-3 6 3" />
      <path d="M4 7v21M10 10v15M16 7v21M22 10v15M28 7v21" />
    </>
  ),
  unsure: (
    <>
      <circle cx="16" cy="16" r="12" />
      <path d="M12.5 12.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3v.5M16 22.5v.5" />
    </>
  ),
  "windows-doors": (
    <>
      <rect x="3" y="7" width="12" height="13" rx="1" />
      <path d="M9 7v13M3 13h12" />
      <path d="M18 28V8.5A1.5 1.5 0 0 1 19.5 7h7A1.5 1.5 0 0 1 28 8.5V28M1.5 28h29" />
      <rect x="20.5" y="10" width="5" height="6" rx=".5" />
    </>
  ),
  "conservatory-roof": (
    <>
      <path d="M3 14 16 5l13 9z" />
      <path d="M16 5 9.5 14M16 5l6.5 9" />
      <path d="M5 14v14h22V14M5 22h22M11.5 14v8M20.5 14v8" />
    </>
  ),
  extension: (
    <>
      <path d="M2 15 11 7l9 8" />
      <path d="M4 13.5V28h14V13.5M8 28v-6h6v6" />
      <path d="M18 18h12v10H18M30 18l-2-3h-8l-2 3" />
      <rect x="22" y="21" width="5" height="4" rx=".5" />
    </>
  ),
  roof: (
    <>
      <path d="M2 17 16 5l14 12" />
      <path d="M6 13.5V28h20V13.5" />
      <path d="M8.5 12h15M11 9h10M13 28v-7h6v7" />
    </>
  ),
  "single-storey": (
    <>
      <path d="M3 14 12 7l9 7" />
      <path d="M5 12.5V27h14V12.5" />
      <path d="M19 18h10v9H19M29 18l-2-3h-6" />
      <path d="M1.5 27h29" />
    </>
  ),
  "two-storey": (
    <>
      <path d="M3 12 12 5l9 7" />
      <path d="M5 10.5V27h14V10.5" />
      <path d="M19 10h10v17H19M19 18.5h10M29 10l-2-3h-6" />
      <path d="M1.5 27h29" />
    </>
  ),
  "new-build": (
    <>
      <path d="M5 16 16 7l11 9" />
      <path d="M8 13.5V26h16V13.5M14 26v-6h4v6" />
      <path d="M2 28h28M4 28l2-2M9 28l2-2M21 28l2-2M26 28l2-2" />
    </>
  ),
  loft: (
    <>
      <path d="M3 17 16 5l13 12" />
      <path d="M6 14.5V28h20V14.5" />
      <path d="M13 11.5l3-2.5 3 2.5V15h-6z" />
      <path d="M12 28v-6h8v6" />
    </>
  ),
  architecture: (
    <>
      <rect x="4" y="5" width="24" height="22" rx="1" />
      <path d="M4 11h24M10 5v6" />
      <path d="M9 23l6-8 6 8M12 19h6" />
    </>
  ),
  bathroom: (
    <>
      <path d="M3 16h26v3a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" />
      <path d="M7 16V7.5A2.5 2.5 0 0 1 9.5 5h0A2.5 2.5 0 0 1 12 7.5M9 25l-1 3M23 25l1 3" />
    </>
  ),
  kitchen: (
    <>
      <rect x="4" y="11" width="24" height="17" rx="1" />
      <path d="M4 17h24M16 17v11M9 21h3M20 21h3" />
      <circle cx="10" cy="7" r="2" />
      <circle cx="22" cy="7" r="2" />
    </>
  ),
  garden: (
    <>
      <path d="M11 28V18" />
      <circle cx="11" cy="12" r="6.5" />
      <path d="M19 28l3-12h4l3 12M2 28h28" />
    </>
  ),
  flooring: (
    <>
      <rect x="3" y="6" width="26" height="20" rx="1" />
      <path d="M3 12.5h26M3 19.5h26M12 6v6.5M22 12.5v7M9 19.5V26M19 6v6.5M25 19.5V26" />
    </>
  ),
  plumbing: (
    <>
      <path d="M4 10h14a4 4 0 0 1 4 4v3" />
      <path d="M4 14h12v3" />
      <path d="M22 21c0 2-1.5 3.5-3 5-1.5-1.5-3-3-3-5s1.5-3 3-4c1.5 1 3 2 3 4z" />
      <path d="M8 6v4M5 6h6" />
    </>
  ),
  electrical: (
    <>
      <rect x="6" y="4" width="20" height="24" rx="2" />
      <path d="M17.5 8 12 17h5l-2.5 7 6-10h-5z" />
    </>
  ),
  security: (
    <>
      <path d="M16 3 5 7v8c0 7 5 12 11 14 6-2 11-7 11-14V7z" />
      <path d="M11 16l3.5 3.5L21 13" />
    </>
  ),
  "air-con": (
    <>
      <rect x="3" y="5" width="26" height="11" rx="2" />
      <path d="M7 12h18" />
      <path d="M9 20c0 2 2 2 2 4s-2 2-2 4M16 20c0 2 2 2 2 4s-2 2-2 4M23 20c0 2 2 2 2 4s-2 2-2 4" />
    </>
  ),
  "solar-battery": (
    <>
      <path d="M2.5 17 7 7h11l-4.5 10z" />
      <path d="M4.7 12h11M9 17l4.5-10M8 17v4.5M5 21.5h6" />
      <rect x="20" y="12" width="9" height="16" rx="1.5" />
      <path d="M22.5 10h4M25 15.5l-2 4h3l-2 4" />
    </>
  ),
  "heat-pump": (
    <>
      <rect x="3" y="7" width="26" height="18" rx="2" />
      <circle cx="12" cy="16" r="5.5" />
      <path d="M12 10.5v11M6.5 16h11M22 11h4M22 15h4M22 19h4" />
    </>
  ),
  "ev-charging": (
    <>
      <rect x="6" y="4" width="13" height="24" rx="2" />
      <path d="M4 28h17M19 12h3a2 2 0 0 1 2 2v7a2 2 0 0 0 4 0v-9l-3-3M13.5 9l-3 5h4l-3 5" />
    </>
  ),
  insulation: (
    <>
      <path d="M3 13 16 5l13 8" />
      <path d="M6 17c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5 0M6 22c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.5 5 0" />
      <path d="M6 13v14h20V13" />
    </>
  ),
};

export function Icon({ name, className = "size-8" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function TickIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 6.2 5 8.5l4.5-5" />
    </svg>
  );
}

export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
