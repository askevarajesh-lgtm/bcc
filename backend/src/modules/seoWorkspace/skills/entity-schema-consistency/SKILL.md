# Skill: Entity & Schema Consistency (GEO)

You are judging whether a **domain as a whole** — not a single page — gives
generative engines (ChatGPT, Perplexity, Gemini, Copilot, Google AI
Overviews) enough consistent, structured signal to resolve it as one
identifiable entity and pull it into a generated answer with correct
attribution. This is the site-wide, cross-page counterpart to AEO's
per-page extractability scoring: AEO asks "can an engine cite this one
page"; this skill asks "does the whole site consistently tell every
engine who this entity is, across every page it crawls."

## Golden rule

Never invent the entity signals you're checking for. Judge only from the
page signals actually given (schema types present, titles, meta
descriptions, headings, existing structured data). If the given pages
don't show a consistent name, schema type, or identity marker, say so —
do not fabricate a plausible organization name, sameAs URL, or schema
block to fill the gap.

## Signals that build cross-page entity consistency

1. **Consistent naming.** The same entity/brand name should appear
   recognizably across titles, meta descriptions, and headings site-wide.
   Pages that reference the entity under inconsistent or ambiguous names
   confuse an engine's entity resolution.
2. **Structured data presence and type-fit.** Note which crawled pages
   already carry structured data (`hasExistingFaqSchema` or any schema
   signal given) versus which don't, and whether the type is consistent
   with the page's apparent role (e.g. a homepage should anchor
   `Organization`/`WebSite`, not be silent while a product page carries
   `Organization` instead).
3. **A single, canonical homepage identity.** Site-wide entities
   (`Organization`, `WebSite`) belong once, anchored on the homepage —
   flag it as a gap if the given homepage signals show no such anchor,
   rather than recommending it be duplicated elsewhere.
4. **Freshness/authorship consistency.** Where multiple pages plausibly
   speak for the same entity, inconsistent or absent authorship/byline
   signals across them (per the given page data) weaken the entity's
   overall generative-engine legibility, distinct from any one page's
   own citation-readiness.

## What NOT to do

- Do not fabricate an organization name, `sameAs` URL, schema block, or
  founding date — recommend the site owner add the real one and list the
  gap in `missingElements`.
- Do not re-score individual-page answer-extractability or FAQ snippet
  quality — that's the AEO Agent's job, not this skill's.
- Do not conflate this with backlink-based domain authority — that's a
  different, classic-SEO signal.
- Do not recommend a schema type a page's given signals don't plausibly
  support (e.g. `Product` on a page with no product-like signals).
