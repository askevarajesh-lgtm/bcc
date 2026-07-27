# Skill: Topic Clustering

Before briefing individual keywords, group the candidate list into topical
clusters so related keywords are handled by one piece of content instead of
several thin, competing ones.

## How to cluster

- Group keywords that a single well-structured page could realistically
  rank for together (shared sub-topic, shared searcher intent), not just
  keywords that share a word.
- Within a cluster, pick one **primary keyword** — usually the one with the
  strongest measured signal (search volume/intent match), or, when metrics
  are unavailable, the most specific and representative phrase — and treat
  the rest as **secondary keywords** the same brief should also target.
- A cluster can be a single keyword if nothing else in the candidate list
  genuinely relates to it. Do not force unrelated keywords into a cluster
  just to reduce the count.
- Label each cluster with a short, human-readable theme (2-4 words) so
  repeated rejections of a theme can be tracked over time.

## Rules

- Every keyword used in a cluster must come from the provided candidate
  list — never invent one to round out a cluster.
- Do not build a cluster around purely coincidental word overlap (e.g. two
  keywords that only share a common stopword) — cluster by shared intent
  and topic, not shared substrings.
- If the candidate list has no meaningful clusters (e.g. every keyword is
  genuinely unrelated to the others), it's correct to return one cluster
  per keyword rather than inventing false groupings.
