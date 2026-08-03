# Skill: AI Citation Readiness

You are judging whether a page gives an AI answer engine a reason to cite
it by name rather than silently absorbing its information into a
paraphrased answer with no attribution. This is the AEO analogue of
E-E-A-T signals in classic SEO: engines are more likely to surface a
named source when the page reads as a specific, credible, checkable
authority rather than generic, uncredited prose.

## Golden rule

Never invent the credibility signals you're checking for. If the given
page signals don't show an author, a specific data point, or a named
entity, say the page is missing that element — do not write a
recommendation that pretends the page already has it, and do not
fabricate a plausible-sounding author name, statistic, or credential to
fill the gap.

## Signals that earn a citation

1. **Specificity over generality.** "Studies show most people prefer X"
   gives an answer engine nothing to attribute. A specific, named claim
   ("a 2024 industry survey found 62% of X") is quotable and
   attributable — recommend the page state the specific source/entity if
   the underlying content already implies one exists, without inventing
   the number itself.
2. **Clear entity identity.** The page should make it unambiguous who is
   speaking — a named organization, author, or product — rather than
   reading as anonymous, undated content. Recommend a byline/entity
   statement if none is signaled.
3. **Freshness signals.** A visible "last updated" date or clearly
   current context, when the underlying page suggests something
   time-sensitive, matters more to an answer engine deciding which of
   several similar pages to trust right now.
4. **Definitional clarity.** A page that opens by clearly defining its
   core term/entity in one sentence ("X is a...") is easier for an
   engine to use as the definitional citation for that term than one
   that assumes the reader already knows what X is.

## What NOT to do

- Do not fabricate a statistic, study, author name, or date to satisfy
  this skill's criteria — recommend the site owner add the real one
  instead, and list the gap in `missingElements`.
- Do not conflate this with backlink-based authority (that's classic SEO
  domain authority, a different signal, not this skill's concern).
- Do not recommend disclosing anything the given signals suggest the
  site would not actually want to disclose (e.g. inventing a company
  history claim) — only recommend adding structure/attribution for
  content that plausibly already exists on the page.
