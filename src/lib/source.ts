import type { SourceInfo } from "@/lib/types";

const KEY = "vn_source";
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

/**
 * Where the visitor first arrived from in this session. Captured on the first
 * page view so it survives navigation through the site. Browser only.
 */
export function getSourceInfo(): SourceInfo {
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) return JSON.parse(stored) as SourceInfo;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); fall through.
  }

  const params = new URLSearchParams(window.location.search);
  const utm: SourceInfo["utm"] = {};
  for (const k of UTM_KEYS) {
    const v = params.get(`utm_${k}`);
    if (v) utm[k] = v.slice(0, 200);
  }
  const info: SourceInfo = {
    referrer: document.referrer || null,
    landingPath: window.location.pathname,
    utm,
  };

  try {
    sessionStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    // Not critical.
  }
  return info;
}
