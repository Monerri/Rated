@AGENTS.md

# Vetted North: project brief

Vetted North (vettednorth.com), a trading name of Roberto Monerri Ltd, introduces homeowners in North East England to vetted home-improvement specialists. Specialists pay for introductions; the service is free for homeowners. This file is the standing brief for anyone (or any Claude session) working on the site. Read it before changing anything.

## The owner's rules

- **Honesty first.** Never use "See if you qualify", fake urgency, invented grants or anything that implies a scheme or offer that doesn't exist. Say plainly what happens to people's details and how we're paid ("Specialists pay us a fee for introductions.").
- **The homeowner is in control.** They choose to hear from one, two or three specialists, and we never introduce more. They're told who the specialists are, with their checks, before anyone contacts them.
- **Separation from specialists.** Specialists are independent businesses, not "our specialists" or "our network". There is no public list or profile of specialists (`/specialists` redirects to How it works): homeowners only see who they are, with the evidence for each check, once introduced, so nobody can bypass the questionnaire.
- **People who are "just researching" are never given company names** or shared with anyone. They can be put in touch, save their answers (kept up to 12 months) or delete them.
- **Property owners only.** Every questionnaire asks "Do you own the property?" (sole owner, joint owner, or not the owner) and "Home or business?". Non-owners are stopped kindly; nothing is saved or shared.
- **Writing style:** British English. Plain, calm, factual. No em dashes. No alarmist wording.
- **Design:** mobile first. The "Hearth" look (chosen November 2026): warm paper backgrounds, Fraunces serif headings with blue italic accents, DM Sans text, Trust Blue buttons, green only for ticks, honey-brown small labels. Tokens in `src/app/globals.css`; photos are optional slots in `src/config/photos.ts` (hidden until supplied). **No purple.** The owner is colour-blind, so never rely on colour alone. Logo: the shield, hexagon and tick mark in `src/components/ui/Logo.tsx` (source files in `docs/brand/`); its blue, slate and green are the palette tokens.
- **The name will change** for a national or global rollout. Never type the name, domain, email addresses or company details: use `site` from `src/config/site.ts` in code and `{{name}}`-style placeholders in Markdown. See `docs/RENAMING.md`.
- **Budget:** Cloudflare (free plan) and GitHub only. No Vercel or other paid hosting.

## The four checks (every specialist)

1. Registered company (Companies House). Registered companies only.
2. Insurance-backed guarantee.
3. Trade scheme registration, per service in `src/config/schemes.ts` (shown on /how-we-check). Some are legal requirements: Gas Safe for any gas work, F gas certification for handling refrigerant (air conditioning), ARB registration to use the title "architect". Not applicable for builders who only do extensions or new builds; shown as "not applicable", never as a tick. Scheme names only, never logos (using a trust mark without permission is a banned practice under consumer law).
4. Google rating above 4.

Checks are reconfirmed at least every 12 months; lapsed specialists stop being matched.

## Services

- **Live (North East England), all 17:** Windows & Doors; Conservatory Roofs; Extensions & New Builds; Roof Replacement; Solar & Battery; Heat Pumps & Air Conditioning; EV Charging; Insulation; Loft Conversions; Architects & Planning; Kitchens; Bathrooms; Gardens, Driveways & Landscaping (lead types: driveways, gardens); Flooring; Plumbing & Heating (slug `plumbing`; lead types: heating, plumbing); Electrical; Security Systems.
- A service can still be set to coming soon (register interest) in `config/services.ts` or at runtime on /admin.
- **Search directory:** `config/serviceKeywords.ts` holds hidden everyday search words per service (a word may sit under several services). Filler words ("repair", "near me", "cheap") are ignored in `lib/serviceSearch.ts`.
- **Finding a service:** /find-a-specialist has a search box ("Select below or type to search"). It matches names, summaries and everyday words in `src/config/serviceKeywords.ts` (add words for every new service), with small typos allowed. No match: we first ask people to look through every service, and only after "I've looked and it isn't listed" say we don't cover it.
- **Postcode:** every questionnaire asks for the full postcode once, near the start, with our data promise and an optional "Use my location". It's checked with postcodes.io (free, no key; `src/lib/geo.ts`), and the contact step reuses it. If postcodes.io can't be reached, a correctly formatted postcode is accepted.
- **Specialist coverage:** a base postcode and a travel radius, capped at 30 miles (`src/config/coverage.ts`) so national firms can't sweep up every lead, plus optional excluded postcode areas or districts (for example Scottish ones across the border). Matching is by straight-line distance from the homeowner's postcode. `areasCovered` remains for older records and as a fallback.
- **Kinds of job:** some services have kinds that specialists opt into (`FunnelConfig.leadTypes`, `Specialist.leadTypes`). Extensions: single-storey, two and three-storey, new-build houses. Heat pumps: heating heat pumps, air conditioning. A lead only goes to specialists who take that kind.

## Leads and money

- **Credits (November 2026).** Specialists buy credits: one credit is worth £1, and they always see the pound value alongside ("40 credits (£40.00)"). Top-ups of £250, £500 and £1,000 or more get 4%, 10% and 15% bonus credits (`creditBonusTiers` in `src/config/pricing.ts`), recorded as separate "bonus" lines. Bonus credits are never paid out as cash: a payout (when we stop introducing someone) refunds unused credits at the average rate paid, bonus included (`cashValueOfBalance` in `src/lib/billing.ts`). Prices are whole credits; the 3 to 6 months discount rounds down. Not VAT registered (`vatRegistered` in pricing config), so no VAT is charged or shown. The ledger is `credit_ledger`; the old pence `ledger` table held only test top-ups and is no longer read.
- **Prepaid credit (Option A).** A lead's price is taken from the specialist's balance at the moment it's sent; they only get the homeowner's details if their balance covers it. Short of credit: skipped, told they missed a lead (no homeowner details), and we're alerted. Failed deliveries are refunded to balance automatically.
- **Prices** come from the owner's sheet "Lead Generation Pricing Benchmark" (Google Sheets, id `1PoDMGBrQ11bBuLtPYhqYTaelP1E5hg60NvQTS131I5s`) and live in `src/config/pricing.ts`. Exclusive (homeowner chose one) costs about double shared. New builds have their own price. Non-urgent (work 3 to 6 months away) is 25% off, and specialists can opt out of non-urgent leads. London & South East prices are stored for when that region is added. Keep the code and the sheet in step.
- **Applicants only see the fees for the services and kinds of job they ticked.**
- **No guaranteed number of leads.** The owner decided against it for now.
- **The ledger is permanent.** Every top-up, lead, refund, adjustment and forfeit is a new line in D1; nothing is edited or deleted.
- **Specialist terms** (`content/legal/supplier-terms.md`, draft for a solicitor): if a specialist leaves, unused credit is held 6 months then forfeited; if we remove them, it's refunded.
- **Lead quality:** contact details are checked before anyone is charged (`src/lib/contact-checks.ts`): email domain typos, throwaway inboxes, domains with no email service, Ofcom drama numbers, fake or premium-rate phone numbers. When a check can't tell, it accepts.
- **Homeowner feedback:** about 14 days after an introduction, a daily job emails the homeowner once to ask whether each specialist got in touch and how they'd rate them (`src/lib/feedback.ts`, `/feedback/[token]`). "Never got in touch" alerts us straight away. Comments are only quoted with ticked permission (first name and area).
- **On/off switch** (`src/lib/listing.ts`): every specialist, demo or real, is only sent leads while they're on. They switch off automatically when their balance is below their cheapest lead (emailed once; back on after a top-up), and the owner can switch anyone off or on by hand on `/admin` (recorded permanently in `listing_switches`). Demo companies aren't charged, so only the manual switch applies to them.
- **Not yet:** Stripe, a business bank account and company registration. The owner wants to prove the idea first. Top-ups are added by hand on `/admin` for now.

## How it runs

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, deployed to Cloudflare Workers with OpenNext. `worker.ts` wraps the build and adds scheduled jobs: Monday 07:05 UTC weekly reports (including enquiries by source for judging adverts, and feedback), daily 09:40 UTC feedback emails.
- **Deploys:** GitHub Actions deploys on every push to `main` and daily at 00:05 UTC (for scheduled blog posts). Work on a branch and open a pull request; the owner merges.
- **Data:** Cloudflare D1 (`vetted-north-database`, binding `DB`). The site creates its own tables and deletes records past the privacy notice's retention periods (`src/lib/records.ts`).
- **Email:** Resend, from hello@vettednorth.com (`RESEND_API_KEY` secret). Emails to demo specialists (`@example.com`) go to the admin inbox instead. On Cloudflare a missing key is a failure, so no record ever says an email was sent when it wasn't.
- **Inboxes:** Cloudflare Email Routing forwards hello@, privacy@ and suppliers@vettednorth.com to the owner.
- **Admin:** `/admin` (on/off switches, balances, top-ups, refunds, history) needs the `ADMIN_API_TOKEN` Worker secret (name matched in any capitalisation).
- **Demo data:** all specialists in `src/data/specialists.ts` are fictional, marked `isDemo`, labelled "demo data" on the site and never charged.

## Checks before a pull request

`npm run lint`, `npm run typecheck`, `npx opennextjs-cloudflare build`, then test in `npx opennextjs-cloudflare preview` (put `EMAIL_LOG_ONLY=1` in `.dev.vars` to log emails locally). See `docs/DEPLOY-CLOUDFLARE.md` and `docs/PUBLISHING.md`.

## Still to do (owner)

- **Before going live: switch off the demo companies** on `/admin` ("Switch off all demo companies"). Until then, real homeowners can be introduced to fictional companies. The admin page and the Monday summary email remind the owner while any are on.

- Connect vettednorth.com to the Worker (links in pages still point there), then change `LINK_ORIGIN` in `wrangler.jsonc` to it.
- Fill in the company number, registered office address and ICO registration number (`legal` in `src/config/site.ts`).
- Have a solicitor review the Privacy notice, Terms and Specialist terms.
- Recruit real specialists (a free beta at £0 per lead is an option), then Stripe top-ups and a supplier dashboard.
