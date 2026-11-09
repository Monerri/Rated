import { site } from "@/config/site";

/**
 * The brand mark: a house-shaped shield with a roofline chevron, an inner
 * hexagon and a tick. Traced from the owner's artwork (docs/brand). Colours
 * come from the palette tokens, so it switches with dark mode. The mark has
 * no words in it, so it survives a change of name.
 */
export const LOGO_VIEWBOX = "340 103 1252 1725";
export const LOGO_PATHS = {
  shield:
    "M966 119 1576 471V1461L966 1812 356 1461V471ZM966 246 467 535V692L966 404 1465 692V535ZM966 531 467 820V1396L966 1684 1465 1396V820Z",
  hexagon:
    "M1249 778 966 615 540 861V1353L966 1598 1392 1353V861L1321 820 1265 892 1299 912V1297L966 1489 633 1297V912L966 720 1186 846Z",
  tick: "M754 1096 820 1046C870 1089 910 1130 945 1172 1060 1015 1170 878 1299 758L1331 779C1180 965 1060 1150 966 1357 905 1265 830 1176 754 1096Z",
};

export function LogoMark({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} aria-hidden="true">
      <path fill="var(--blue)" fillRule="evenodd" d={LOGO_PATHS.shield} />
      <path fill="var(--muted)" d={LOGO_PATHS.hexagon} />
      <path fill="var(--green)" d={LOGO_PATHS.tick} />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-display text-[19px] font-extrabold tracking-tight text-ink">
      <LogoMark />
      {site.name}
    </span>
  );
}
