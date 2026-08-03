# Skill: Competitor Threat Assessment

Assess how much of a real SEO threat a competitor is, using objective
overlap/authority signals rather than assumptions from the domain name alone.

## Signals, in priority order
1. **Keyword overlap (`commonKeywords`)** — how many of the tracked site's
   target/ranking terms this competitor also ranks for. High overlap with
   high competitor traffic is the strongest threat signal.
2. **Organic traffic / traffic value (`organicTraffic`, `organicCost`)** —
   a competitor with far higher estimated organic traffic than the tracked
   site, especially concentrated in overlapping keywords, indicates they are
   winning the same audience.
3. **Authority (`referringDomains`, `backlinks`, `domainRank`)** — a
   competitor with materially stronger backlink authority will be harder to
   outrank on contested terms even with equal on-page work.
4. **Breadth (`organicKeywords`)** — a much larger total footprint suggests
   a broader competitor (may not be a direct threat on every term) versus a
   narrow, high-overlap competitor (usually a sharper direct threat).

## Threat level guidance
- **high** — meaningful keyword overlap AND (traffic or authority) clearly
  exceeds the tracked site's own numbers.
- **medium** — some overlap, comparable scale, or strong on one signal but
  weak on others.
- **low** — minimal overlap, or metrics are all 0/unavailable (nothing
  objective to base a "high" call on — do not default to high threat just
  because a domain was returned as similar).

## What NOT to do
- Do not infer threat level from the domain name, industry reputation, or
  brand recognition alone — base it on the metrics provided.
- Do not treat a competitor with all-zero metrics (no data source
  available) as automatically low-priority for review — flag that data was
  unavailable in the rationale so a human knows to check manually, and keep
  the default threat level rather than asserting "low" as if it were measured.
