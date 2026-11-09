import { serviceKeywords } from "@/config/serviceKeywords";
import type { Service } from "@/lib/types";

/**
 * Matching for the service search box. Every word typed must match a word
 * in the service's name, summary or everyday keywords: by its start ("sol"
 * finds "solar"), or with a small typo ("conservatry"). Runs in the browser.
 */

const STOP_WORDS = new Set(["a", "an", "and", "the", "for", "of", "to", "my", "in", "on", "new", "i", "need", "want", "with", "or", "your"]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
}

/** Edit distance, stopping early once it's over the limit. */
function withinEdits(a: string, b: string, limit: number): boolean {
  if (Math.abs(a.length - b.length) > limit) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > limit) return false;
    prev = row;
  }
  return prev[b.length] <= limit;
}

function wordMatches(typed: string, target: string): boolean {
  if (target.startsWith(typed)) return true;
  // Plurals and close spellings: "radiators", "insulaton", "conservatry".
  if (typed.length >= 4 && typed.startsWith(target) && typed.length - target.length <= 2) return true;
  const limit = typed.length >= 8 ? 2 : typed.length >= 5 ? 1 : 0;
  return limit > 0 && withinEdits(typed, target.slice(0, Math.max(typed.length, target.length)), limit);
}

const vocabularyCache = new Map<string, string[]>();

function vocabulary(s: Service): string[] {
  let v = vocabularyCache.get(s.slug);
  if (!v) {
    v = [...new Set(words([s.name, s.summary, ...(serviceKeywords[s.slug] ?? [])].join(" ")))];
    vocabularyCache.set(s.slug, v);
  }
  return v;
}

/** Whether a service matches what was typed. An empty search matches everything. */
export function matchesSearch(s: Service, query: string): boolean {
  const typed = words(query);
  if (typed.length === 0) return true;
  const vocab = vocabulary(s);
  return typed.every((t) => vocab.some((w) => wordMatches(t, w)));
}
