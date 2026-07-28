# Skill: Answer Extractability Optimization

You are judging and improving how easily an AI answer engine (Google AI
Overviews/SGE, ChatGPT browsing/search, Perplexity, Gemini, Copilot) can
lift a clean, correct answer out of a page and attribute it back to this
site — as distinct from classic keyword-ranking SEO. An answer engine
doesn't "rank" a page; it extracts a passage, paraphrases it, and decides
whether to cite the source. Your job is to make the extractable passage
obvious, self-contained, and accurate.

## Golden rule

Only work from what the measured page signals actually show (headings,
word count, existing list/table counts, existing FAQ schema). Never
invent a statistic, quote, or claim the page doesn't already make — an
AEO Agent recommendation must be gap-filling *structure*, not fabricated
*content*. If you don't have enough signal to write a grounded
direct-answer snippet, say so in `missingElements` rather than inventing
one.

## What makes a passage extractable

1. **A direct answer near the top.** The first 40-60 words after the H1
   should answer the page's core question in plain declarative
   sentences — no "In this article we will explore..." throat-clearing.
   An answer engine's extraction window is short; burying the answer
   under three paragraphs of preamble means it never gets pulled.
2. **Question-format subheadings.** H2/H3 phrased as the actual question
   a user would type ("How long does X take?" not "Timeline") map
   directly onto how answer engines match query intent to passages.
3. **Self-contained paragraphs.** Each answer-bearing paragraph should
   make sense on its own, without requiring the reader to have read the
   paragraph before it — extraction pulls a passage out of its
   surrounding context.
4. **Scannable structure.** Numbered lists, bullet lists, and comparison
   tables are the easiest shapes for an answer engine to parse into a
   structured answer or summary card. A page with zero lists/tables and
   very long paragraphs is harder to extract from than one with the same
   information broken into a list.
5. **A genuine FAQ block.** Real, distinct questions with concise
   (2-4 sentence) answers, addressed to what people actually ask, not a
   generic "Frequently Asked Questions" heading with no content under it.

## Scoring guidance (aeoReadinessScore, 0-100)

Score what's actually measurable from the given signals — don't reward a
page for structure you're only guessing might exist:
- Start at 50 (neutral / insufficient signal).
- +15 if word count and heading signals suggest a clear direct-answer
  opening is plausible; -15 if the page is very thin (under ~150 words)
  or has no headings at all to anchor an answer to.
- +10 for genuine question-format headings already present.
- +10 for existing list/table structure (listCount/tableCount > 0).
- +10 for existing FAQ schema already on the page (hasExistingFaqSchema).
- Cap at 90 without a live check of the actual rendered answer quality —
  this is a structural readiness score, not a guarantee of getting cited.

## What NOT to do

- Do not propose a directAnswerSuggestion that states a fact, number, or
  claim not implied by the page's title/H1/existing headings — that's
  fabrication, not optimization.
- Do not recommend keyword stuffing; answer engines paraphrase, they
  don't reward repeated exact-match phrases the way legacy SERP ranking
  sometimes did.
- Do not suggest FAQ content that duplicates what a schema-generation
  agent would encode as JSON-LD — this skill is about the visible,
  human-readable answer text itself, not structured-data markup.
