# Vetted North

Consumer website for Vetted North: homeowners describe what they want to improve and are matched with one vetted local specialist.

Built with Next.js (App Router), TypeScript and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## Where things live

| Path | What it holds |
|---|---|
| `src/config/services.ts` | Service catalogue. Switch a service from `coming_soon` to `live` here. |
| `src/config/regions.ts` | Regions and their postcode areas. Add a region to open a new market. |
| `src/config/vetting.ts` | The consumer-facing checks. Add a check here to extend the standard. |
| `src/config/site.ts` | Brand name and company details (placeholders until registered). |
| `src/lib/types.ts` | Domain types that mirror the planned database tables. |
| `src/lib/consent.ts` | Versioned consent wording. Stored with every record. |
| `src/lib/records.ts` | Persistence boundary. The prototype store only logs; swap in Supabase here. |
| `src/app/api/interest` | Register-interest endpoint for coming-soon services. |
| `src/data/demo-specialist.ts` | Fictional specialist. Always labelled as demonstration data. |

## Status

- Step 5, homepage: done.
- Next: Windows & Doors funnel, Conservatory Roof funnel, register-interest pages, supplier section, vetting pages.

Nothing is persisted yet. Submissions are validated and written to the server log only.
