# Changing the name, domain or company details

The trading name, web address, email addresses and company details are kept in one file, `src/config/site.ts`. Pages, page titles, emails and the legal pages all read from it. Markdown content uses placeholders such as `{{name}}` and `{{companyName}}` instead of typing them (the full list is `contentPlaceholders` in the same file).

## A new name

1. In `src/config/site.ts`, change `name` (and `tagline` or `description` if they mention it).
2. Replace the wordmark if there is one. The logo mark itself (`src/components/ui/Logo.tsx`, `src/app/icon.svg`, `src/app/apple-icon.png`, `docs/brand/`) has no words in it, so it can stay.
3. Search the repository for the old name to catch anything new: `grep -rn "Old Name" src content`.

## A new domain

1. Connect the domain to the Worker in Cloudflare, and verify it in Resend so emails can be sent from it.
2. In `src/config/site.ts`, change `domain`. The contact, privacy and suppliers email addresses follow it.
3. Set up Email Routing for hello@, privacy@ and suppliers@ on the new domain.
4. In `wrangler.jsonc`, change `SITE_URL` and `LINK_ORIGIN`, and in `.github/workflows/deploy.yml` change `SITE_URL`.
5. In Cloudflare, redirect the old domain to the new one so existing links and emails keep working.

## Company details

`legal` in `src/config/site.ts`: company name, number, place of registration, registered office and ICO number. They appear in the footer, on the About page and in the Terms and Privacy notice. UK law requires a company's website to show its registered name, number, place of registration and registered office address.

## Things outside the code

The Worker's name (`vetted-north`), the D1 database name and the GitHub repository name don't appear to visitors and don't need to change. The pricing Google Sheet, the Cloudflare and Resend account names, social media accounts and the ICO registration (trading names are listed on it) do need updating by hand.
