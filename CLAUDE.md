@AGENTS.md

# Vetted North: project brief

Vetted North (vettednorth.com) introduces homeowners in North East England to vetted home-improvement specialists. Specialists pay for introductions; the service is free for homeowners. This file is the standing brief for anyone (or any Claude session) working on the site. Read it before changing anything.

## The owner's rules

- **Honesty first.** Never use "See if you qualify", fake urgency, invented grants or anything that implies a scheme or offer that doesn't exist. Say plainly what happens to people's details and how we're paid ("Specialists pay us a fee for introductions.").
- **The homeowner is in control.** They choose to hear from one, two or three specialists, and we never introduce more. They're told who the specialists are, with their checks, before anyone contacts them.
- **People who are "just researching" are never given company names** or shared with anyone. They can be put in touch, save their answers (kept up to 12 months) or delete them.
- **Property owners only.** Every questionnaire asks "Do you own the property?" (sole owner, joint owner, or not the owner) and "Home or business?". Non-owners are stopped kindly; nothing is saved or shared.
- **Writing style:** British English. Plain, calm, factual. No em dashes. No alarmist wording.
- **Design:** mobile first. Blue and green palette. **No purple.** The owner is colour-blind, so never rely on colour alone.
- **Budget:** Cloudflare (free plan) and GitHub only. No Vercel or other paid hosting.

## The four checks (every specialist)

1. Registered company (Companies House). Registered companies only.
2. Insurance-backed guarantee.
3. Competent Person Scheme, where relevant (not applicable for builders who only do extensions or new builds; shown as "not applicable", never as a tick).
4. Google rating above 4.

Checks are reconfirmed at least every 12 months; lapsed specialists stop being matched.

## Services

- **Live (North East England):** Windows & Doors; Conservatory Roofs; Extensions & New Builds; Roof Replacement; Solar & Battery; Heat Pumps & Air Conditioning; EV Charging; Insulation.
- **Coming soon (register interest):** Loft Conversions; Architects & Planning; Kitchens; Bathrooms; Gardens, Driveways & Landscaping; Flooring; Plumbing; Electrical; Security Systems.
- **Kinds of job:** some services have kinds that specialists opt into (`FunnelConfig.leadTypes`, `Specialist.leadTypes`). Extensions: single-storey, two and three-storey, new-build houses. Heat pumps: heating heat pumps, air conditioning. A lead only goes to specialists who take that kind.

## Leads and money

- **Prepaid credit (Option A).** A lead's price is taken from the specialist's balance at the moment it's sent; they only get the homeowner's details if their balance covers it. Short of credit: skipped, told they missed a lead (no homeowner details), and we're alerted. Failed deliveries are refunded to balance automatically.
- **Prices** come from the owner's sheet "Lead Generation Pricing Benchmark" (Google Sheets, id `1PoDMGBrQ11bBuLtPYhqYTaelP1E5hg60NvQTS131I5s`) and live in `src/config/pricing.ts`. Exclusive (homeowner chose one) costs about double shared. New builds have their own price. Non-urgent (work 3 to 6 months away) is 25% off, and specialists can opt out of non-urgent leads. London & South East prices are stored for when that region is added. Keep the code and the sheet in step.
- **Applicants only see the fees for the services and kinds of job they ticked.**
- **No guaranteed number of leads.** The owner decided against it for now.
- **The ledger is permanent.** Every top-up, lead, refund, adjustment and forfeit is a new line in D1; nothing is edited or deleted.
- **Specialist terms** (`content/legal/supplier-terms.md`, draft for a solicitor): if a specialist leaves, unused credit is held 6 months then forfeited; if we remove them, it's refunded.
- **Not yet:** Stripe, a business bank account and company registration. The owner wants to prove the idea first. Top-ups are added by hand on `/admin` for now.

## How it runs

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, deployed to Cloudflare Workers with OpenNext. `worker.ts` wraps the build and adds the Monday 07:05 UTC weekly reports.
- **Deploys:** GitHub Actions deploys on every push to `main` and daily at 00:05 UTC (for scheduled blog posts). Work on a branch and open a pull request; the owner merges.
- **Data:** Cloudflare D1 (`vetted-north-database`, binding `DB`). The site creates its own tables and deletes records past the privacy notice's retention periods (`src/lib/records.ts`).
- **Email:** Resend, from hello@vettednorth.com (`RESEND_API_KEY` secret). Emails to demo specialists (`@example.com`) go to the admin inbox instead. On Cloudflare a missing key is a failure, so no record ever says an email was sent when it wasn't.
- **Inboxes:** Cloudflare Email Routing forwards hello@, privacy@ and suppliers@vettednorth.com to the owner.
- **Admin:** `/admin` (balances, top-ups, refunds, history) needs the `ADMIN_API_TOKEN` Worker secret (name matched in any capitalisation).
- **Demo data:** all specialists in `src/data/specialists.ts` are fictional, marked `isDemo`, labelled "demo data" on the site and never charged.

## Checks before a pull request

`npm run lint`, `npm run typecheck`, `npx opennextjs-cloudflare build`, then test in `npx opennextjs-cloudflare preview` (put `EMAIL_LOG_ONLY=1` in `.dev.vars` to log emails locally). See `docs/DEPLOY-CLOUDFLARE.md` and `docs/PUBLISHING.md`.

## Still to do (owner)

- Connect vettednorth.com to the Worker (links in pages still point there).
- Fill in the company name, number and ICO registration (placeholders in `src/config/site.ts`).
- Have a solicitor review the Privacy notice, Terms and Specialist terms.
- Recruit real specialists (a free beta at £0 per lead is an option), then Stripe top-ups and a supplier dashboard.
