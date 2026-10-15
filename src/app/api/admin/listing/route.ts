import { specialists } from "@/data/specialists";
import { authorised } from "@/lib/admin";
import { setListing } from "@/lib/listing";
import { jsonError, readJson, str } from "@/lib/request";

/**
 * Switches specialists on or off by hand.
 * Body: { supplierSlug: string } for one specialist, or { allDemo: true } for
 * every demo specialist; plus { on: boolean, note?: string }.
 */
export async function POST(request: Request) {
  if (!authorised(request)) return jsonError("Not found.", 404);
  const body = await readJson(request);
  if (typeof body?.on !== "boolean") return jsonError("Say whether to switch on or off.");
  const on = body.on as boolean;

  let slugs: string[];
  if (body?.allDemo === true) {
    slugs = specialists.filter((s) => s.isDemo).map((s) => s.slug);
  } else {
    const slug = String(body?.supplierSlug ?? "");
    if (!specialists.some((s) => s.slug === slug)) return jsonError("Unknown specialist.");
    slugs = [slug];
  }

  const note = str(body?.note, 300) || (on ? "Switched on" : "Switched off");
  const changed = await setListing(slugs, on, note);
  return Response.json({ changed });
}
