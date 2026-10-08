# Publishing guides and blog posts

Guides live in `content/guides/` and blog posts in `content/blog/`. Each article is one Markdown file. The file name becomes the web address, so `content/blog/winter-draughts.md` is published at `/blog/winter-draughts`.

## Adding a blog post

1. Copy `content/blog/_TEMPLATE.md` and rename it.
2. Fill in `title`, `description` and `date`, then write the post.
3. Commit it to `main`. The site redeploys automatically.

## Scheduling posts

A post with a future `date` stays hidden until that day. You can commit a week of posts at once and they'll appear one a day. The site redeploys automatically every day at 00:05 UTC, which publishes that day's posts.

## Search engines

Every published guide and post is added to `/sitemap.xml` automatically, and posts are listed in the RSS feed at `/blog/rss.xml`. Each article page includes structured data (schema.org) and a canonical address.

## House style

- Write for a homeowner with a real question. Helpful first.
- British English. No em-dashes.
- Never imply grants or funding exist unless a specific, current scheme is named and linked to GOV.UK, with "at the time of writing".
- No "best" claims, no guarantees and no competitor comparisons.
- Link to a relevant guide or service where it genuinely helps.

Posting often only helps search rankings if each post is genuinely useful. Search engines treat large volumes of thin or repetitive content as a negative signal, so a smaller number of good posts is better than a daily post for its own sake.
