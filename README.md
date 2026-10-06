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
| `src/app/api/interest` | Register-interest endpoint, plus unsubscribe. |
| `src/lib/catalogue.ts` | Live service catalogue: config plus runtime overrides. Use this for "is it live?". |
| `src/config/suppliers.ts` | Supplier criteria, Competent Person Scheme options (alphabetical, unranked) and declaration wording. |
| `src/lib/launch.ts` | Switches a service live or back, and sends the one "now available" email. |
| `src/data/specialists.ts` | Fictional specialist directory. Always labelled as demonstration data. |
| `src/funnels/` | Questionnaire configs and the engine that validates and summarises answers. |
| `src/lib/matching.ts` | Picks the one specialist for an enquiry (service, postcode, current checks). |
| `src/lib/enquiries.ts` | Enquiry pipeline: validate, match, store, email the homeowner, then the specialist. |
| `src/lib/notifications.ts` | Email templates and the sender boundary. The prototype sender only logs. |

## Status

- Step 5, homepage: done.
- Step 6, Windows & Doors funnel: done, including automatic specialist matching and notification emails.
- Step 7, Conservatory Roofs funnel: done.
- Step 8, coming soon and register interest: done.
- Step 9, supplier section: done. Applications are stored with status "received", acknowledged by email and sent to `site.supplierApplicationsEmail` for review.
- Next: vetting pages and specialist profiles.

## Switching a service on or off without a rebuild

Set `ADMIN_API_TOKEN`, then:

```bash
curl -X POST https://<site>/api/admin/services/<service-slug> \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"live","regions":["north-east-england"]}'
```

A service can only go live once it has a questionnaire in `src/funnels`. Going live emails everyone who registered interest in that region, once. The route is disabled when `ADMIN_API_TOKEN` is not set.

Prototype limits: records are held in server memory only and emails are written to the server log, not sent. Connect Supabase in `src/lib/records.ts` and an email provider in `src/lib/notifications.ts`. Set `SITE_URL` so links in emails use the live domain.
