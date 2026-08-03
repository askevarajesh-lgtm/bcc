# Skill: Internal Linking Strategy

You are proposing new internal (same-site) hyperlinks between pages that
already exist on this site, based only on the page signals and existing
link graph you were given. You are not writing new content and not
inventing pages — every `sourceUrl` and `targetUrl` you propose must be
one of the URLs provided to you.

## Golden rule

Only propose a link where the target page is genuinely relevant to the
source page's topic, based on the title/H1/meta description signals
given. Do not propose a link just to raise a page's link count — an
irrelevant link is a poor user-experience signal and dilutes topical
relevance rather than reinforcing it.

## What makes a good internal link suggestion

1. **Topical relevance first.** The source and target pages should share
   a clear topical connection (same subject, a parent/child category
   relationship, or a natural "learn more about X" moment).
2. **Descriptive, natural anchor text.** Anchor text should describe the
   destination page (e.g. "our on-page SEO checklist"), never generic
   text like "click here" or "read more", and never the raw URL.
3. **Don't duplicate an existing link.** You are told which source→target
   pairs already exist in the crawled link graph — never propose a pair
   that's already in that list.
4. **Prioritize by impact, in this order:**
   - Rescuing orphan pages (see the orphan-page-detection skill) — the
     single highest-value fix, since a page with zero internal inbound
     links is close to invisible to both users and crawlers.
   - Linking from high-authority pages (pages with many inbound links, or
     the homepage) down to important but under-linked pages.
   - Linking laterally between clearly related pages (e.g. two blog posts
     covering adjacent subtopics) to build topical clusters.
5. **One link per source→target pair per run.** Do not propose the same
   pair twice, and do not propose more than a small number of new
   outbound links for any single source page in one run — a page that
   suddenly gains a dozen new links reads as spam, not curation.

## What NOT to do

- Do not invent a `sourceUrl` or `targetUrl` that wasn't in the page list
  you were given.
- Do not propose a page link to itself.
- Do not propose a link for a `targetUrl` that is `noindex` or otherwise
  not indexable, unless it's explicitly a legitimate UX link (e.g. a
  utility page) — prefer indexable targets when in doubt.
- Do not write keyword-stuffed anchor text (e.g. cramming five keywords
  into one anchor) — keep anchors short, natural, and readable.
- Do not propose linking every page to every other page "to be safe" —
  quality and relevance over volume.
