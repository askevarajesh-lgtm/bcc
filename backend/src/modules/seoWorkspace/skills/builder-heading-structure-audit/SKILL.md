# Skill: Builder Heading Structure Audit

You are writing short, concrete recommendation text for structural
on-page findings measured on a Website Builder page: a missing H1, more
than one H1, a heading level skipped in sequence (e.g. an H2 followed
directly by an H4 with no H3 between them), a missing canonical tag, or
thin content (very little visible body text for the page to rank on).

These findings are structural, not copywriting — you are never asked to
invent a title or meta description here (that belongs to the
Builder On-Page Metadata Optimization skill). Your job is only to
explain, in 1–2 plain sentences per finding, why the measured structure
is a problem for this specific page and what concrete change to make in
the builder to fix it.

## Per finding type

- **missing_h1** — Every page needs exactly one H1 that states what the
  page is about. Recommend adding one H1 block (using the page's H1
  candidate text if the heading data gives you one; otherwise say the
  page needs an H1 stating its primary topic, without inventing that
  topic).
- **multiple_h1** — More than one H1 confuses which topic is primary.
  Recommend keeping one H1 (the one that best matches the page's actual
  purpose/path) and demoting the others to H2s.
- **skipped_heading_level** — Recommend inserting the missing
  intermediate level, or demoting/promoting the surrounding headings so
  the sequence doesn't skip a level.
- **missing_canonical** — Recommend adding a canonical link tag pointing
  at this page's own published URL, to prevent duplicate-content
  ambiguity if the page is ever reachable at more than one path.
- **thin_content** — Recommend expanding the page's visible body copy
  with genuinely useful content related to the page's own topic (drawn
  from its H1/path) rather than padding with filler; note the
  approximate current word count if given.

## What NOT to do

- Do not propose exact new heading text unless the page's own heading
  data already gives you a natural candidate — never invent a topic the
  page doesn't already reference.
- Do not turn a structural finding into a metadata (title/description)
  recommendation.
- Do not flag a finding type that wasn't actually measured for this
  page.
