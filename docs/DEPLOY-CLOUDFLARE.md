# Deploying to Cloudflare (free plan)

The site runs on Cloudflare Workers, deployed from GitHub by GitHub Actions. Nothing here needs a paid plan.

## How it works

- Every page is built once, at deploy time, and served as a static file. Only the forms (enquiries, register interest, saved progress, supplier applications, contact) run code on each request.
- `.github/workflows/deploy.yml` deploys whenever `main` changes, and again every day at 00:05 UTC so scheduled blog posts appear on their date.
- `.github/workflows/check.yml` checks every other branch and pull request (lint, types, Cloudflare build) without deploying.

## One-time setup (about 15 minutes)

### 1. Create a Cloudflare API token

1. In the Cloudflare dashboard, open **My Profile → API Tokens → Create Token**.
2. Choose the **Edit Cloudflare Workers** template.
3. Under **Account Resources**, select your account. Under **Zone Resources**, select **All zones** (or just vettednorth.com).
4. Create the token and copy it. You only see it once.

### 2. Find your Cloudflare account ID

In the dashboard, open **Workers & Pages**. The account ID is shown in the right-hand column. Copy it.

### 3. Add both to GitHub

In the `Monerri/rated` repository on GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | the ID from step 2 |

### 4. Deploy

Merge the work into `main` (or run **Actions → Deploy to Cloudflare → Run workflow**). After two or three minutes the site is live at `https://vetted-north.<your-subdomain>.workers.dev`. The address is shown at the end of the workflow log and in **Workers & Pages → vetted-north**.

### 5. Connect vettednorth.com

1. In **Workers & Pages → vetted-north → Settings → Domains & Routes**, choose **Add → Custom domain**.
2. Enter `vettednorth.com` and confirm. Because the domain is already on Cloudflare, the DNS record and security certificate are created automatically. If Cloudflare reports an existing record for the domain, delete that record under **DNS → Records** first.
3. Repeat for `www.vettednorth.com`.
4. To send `www` visitors to the main address, open **Rules → Redirect Rules → Create rule**, choose the **Redirect from WWW to root** template and deploy it.

### 6. Email addresses

The site uses hello@, privacy@ and suppliers@vettednorth.com. Set them up under **Email → Email Routing** to forward to your usual inbox. It's free.

## Database (Cloudflare D1)

Enquiries, saved answers, interest registrations and supplier applications are stored in a D1 database bound to the Worker as `DB`.

The database's name and ID are in `wrangler.jsonc` under `d1_databases` (shown in **Storage & Databases → D1** in the dashboard).

The site creates its own tables the first time it needs them, and every few hours deletes records older than the periods in the privacy notice. Both happen through the Worker's own database connection, so the GitHub Actions token needs no database permission. The SQL is in `src/lib/records.ts`.

To look at records, open the database in the dashboard and use the **Console** tab, for example:

```sql
SELECT created_at, json_extract(data, '$.serviceSlug') AS service FROM enquiries ORDER BY created_at DESC;
```

## Email (Resend)

Emails are sent through Resend from `EMAIL_FROM` in `wrangler.jsonc`. The domain must be verified in Resend.

Add the Resend API key as a **secret**: **Workers & Pages → vetted-north → Settings → Variables and Secrets → Add**, type **Secret**, name `RESEND_API_KEY`. Until it's set, the live forms show an error and nothing is shared with anyone, so no record ever says an email was sent when it wasn't. For a local preview (`npm run cf:preview`), put `EMAIL_LOG_ONLY=1` in `.dev.vars` to log emails instead.

Links in emails use the address the visitor is on, so they work on the workers.dev address until vettednorth.com is connected.

Emails meant for demonstration specialists (`@example.com` addresses) go to `ADMIN_EMAIL` instead, marked "[Demo specialist copy]", so you can see what a specialist would receive.

If the homeowner's confirmation email can't be sent, nothing is shared with any specialist and they're asked to check their email address.

Resend's free plan allows 100 emails a day and 3,000 a month. Each enquiry uses one email for the homeowner plus one per specialist.

## Optional: admin token

The service on/off switch (`/api/admin/services/...`) is disabled unless `ADMIN_API_TOKEN` is set. To set it, run `npx wrangler secret put ADMIN_API_TOKEN` or add it under **Workers & Pages → vetted-north → Settings → Variables and Secrets**. The change applies to the forms straight away; pre-built pages show it after the next deploy (at the latest, the daily one at 00:05 UTC).

## Limits to know about

- **Free plan:** 100,000 requests a day and 10 ms of processing time per request. Pre-built pages use almost none; the forms are light. If traffic outgrows the free plan, Workers Paid is $5 a month.
- **D1 free plan:** 5 GB of storage and 5 million rows read a day, far more than this site needs.
- **Resend free plan:** 100 emails a day. Upgrade before running paid advertising.
