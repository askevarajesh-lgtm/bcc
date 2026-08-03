# Skill: Orphan Page Detection

An "orphan page" is a page on the site that no other crawled page links
to internally. Search engines discover and rank pages substantially
through internal links, so an orphan page — even one with a sitemap
entry — receives little to no crawl equity and is effectively invisible
to normal site navigation.

You will be given each page's `inboundLinkCount`, computed deterministically
from the crawled link graph (not your judgment) — a page with
`inboundLinkCount: 0` (and which is not the homepage) is an orphan.

## How to treat orphan pages

1. **Always propose at least one rescue link for every orphan page in the
   candidate set**, unless there is genuinely no topically relevant
   source page available — do not skip an orphan silently without
   considering it.
2. **Pick the most relevant available source**, not just the highest-
   authority one. A topically adjacent blog post or category page is a
   better source than an unrelated high-traffic page.
3. **Mark these suggestions with `reasonCategory: "orphan_rescue"`** so a
   human reviewer can immediately see which suggestions are fixing a
   structural gap versus general topical linking.
4. **Don't manufacture false urgency** — a page with `inboundLinkCount: 1`
   or more is not an orphan, even if that count is low; only zero-inbound
   pages qualify for `orphan_rescue`.

## Secondary signal: thin, low-authority pages

Pages with a nonzero but very low inbound count (1) are not orphans, but
are still worth reinforcing if they're topically central (e.g. a
cornerstone/pillar page) — use `reasonCategory: "hub_page_linking"` for
these when you deliberately link a lower-traffic page toward one that
should be acting as a hub, and `reasonCategory: "topical_relevance"` for
ordinary lateral link opportunities that aren't about rescuing anything.

## What NOT to do

- Do not report a page as an orphan if `inboundLinkCount` is anything
  other than exactly 0, or if it's the homepage.
- Do not invent an inbound-link count — it is always given to you,
  never estimated.
- Do not leave an orphan page with a relevant candidate source unaddressed
  just because it would be your only suggestion for that source page.
