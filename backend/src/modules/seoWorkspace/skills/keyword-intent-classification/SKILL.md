# Skill: Keyword Intent Classification & Theming

When grouping keyword candidates into themes, use search intent as the
primary organizing signal, not surface-level word overlap.

## Intent categories

- **informational** — the searcher wants to learn something (how, what,
  why, guides, definitions).
- **navigational** — the searcher is looking for a specific site or brand.
- **commercial** — the searcher is comparing options before a decision
  (best, top, vs, reviews).
- **transactional** — the searcher is ready to act (buy, price, near me,
  book, sign up).

## Theming rules

- A "theme" is a short label (2-4 words) grouping keywords that serve the
  same underlying searcher goal, not just keywords that share a word. E.g.
  "emergency dental care" and "urgent dentist near me" are the same theme;
  "dental implants cost" and "dental implant materials" are not, even
  though both contain "dental implant."
- Prefer a small number of clear themes over many overlapping ones — if two
  candidate themes would only differ by a synonym, merge them.
- Do not force a theme onto a keyword that doesn't clearly belong to any
  existing group; it's fine for a keyword to stand alone as its own theme.
- When a provided intent signal exists in the input data, trust it over
  guessing from the keyword text alone; only infer intent from the text
  itself when no intent data was provided.
