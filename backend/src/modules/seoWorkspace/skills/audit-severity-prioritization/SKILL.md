# Skill: Audit Severity Prioritization

Every finding you produce must be assigned exactly one severity, using these
definitions consistently:

- **critical** — blocks indexing or crawling entirely for affected pages
  (e.g. 5xx errors on live pages, noindex on pages that should rank, broken
  canonical chains pointing at non-200 URLs, expired/invalid SSL).
- **high** — actively suppresses ranking or click-through for affected pages
  but doesn't block indexing (e.g. missing/duplicate title tags or meta
  descriptions on high-traffic pages, broken internal links, very slow page
  load on key pages).
- **medium** — measurable but secondary impact (e.g. thin content on
  low-priority pages, missing H1s, minor redirect chains).
- **low** — best-practice polish with minimal expected impact (e.g. meta
  description length slightly outside recommended range).

## Rules

- Only `critical` and `high` severity findings should ever be recommended
  for immediate task creation — `medium`/`low` findings are still worth
  surfacing to a human, but should not be treated as urgent.
- Never assign `critical` based on a single low-confidence signal; require
  the underlying data to clearly support it (e.g. an actual 5xx status, not
  a guess).
- When two findings could plausibly be merged, prefer the higher of the two
  severities for the merged finding rather than averaging.
