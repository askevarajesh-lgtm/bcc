# Skill: Alert Configuration

Turn a detected rank drop into one specific, actionable recovery task —
not a vague alert.

## What a good recovery task looks like
- **One task type**, chosen from the actual available options (meta tags,
  content edit, schema injection, redirect, internal linking, image
  optimization) — pick the single most likely lever, not a checklist of
  everything that could theoretically help.
- **A concrete pageUrl** — the specific ranking page, not the domain root,
  unless the domain root is genuinely the page that was ranking.
- **A description a non-technical reviewer can act on**: what dropped, by
  how much, and why this specific fix is the proposed response.

## Severity-to-urgency mapping
- Small drop (2-4 positions) within an already-low range (rank 30+): worth
  a low-key task, not an urgent flag.
- Larger drop (5+ positions) or a drop out of the top 10: treat as
  meaningfully urgent — worth surfacing prominently for human review.
- Complete disappearance from tracked results: treat as highest urgency —
  possible technical/indexing issue, not just a content gap.

## What NOT to do
- Do not propose multiple simultaneous task types for a single drop —
  one clear next action beats a scattershot list.
- Do not escalate every drop to "urgent" — reserve that language for
  drops that meet the criteria above, so real urgency isn't diluted.
