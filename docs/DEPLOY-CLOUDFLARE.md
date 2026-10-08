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

## Optional: admin token

The service on/off switch (`/api/admin/services/...`) is disabled unless `ADMIN_API_TOKEN` is set. To set it, run `npx wrangler secret put ADMIN_API_TOKEN` or add it under **Workers & Pages → vetted-north → Settings → Variables and Secrets**. It only becomes useful once records are kept in a database (see below).

## Limits to know about

- **Free plan:** 100,000 requests a day and 10 ms of processing time per request. Pre-built pages use almost none; the forms are light. If traffic outgrows the free plan, Workers Paid is $5 a month.
- **Records aren't kept yet.** The prototype holds enquiries, registrations and saved answers in memory, which on Cloudflare can be cleared at any time. Before taking real enquiries, connect a database. Cloudflare D1 is free at this scale and would keep everything on Cloudflare.
- **Emails aren't sent yet.** They're written to the Worker's logs (**Workers & Pages → vetted-north → Logs**). Connect an email provider before launch. Resend, for example, has a free tier.
- **Switching a service live** is, for now, an edit to `src/config/services.ts` followed by a deploy. Switching without a deploy returns when the database is connected.
