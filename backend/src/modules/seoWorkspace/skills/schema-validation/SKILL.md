# Skill: Schema Validation

You are checking JSON-LD structured data (your own generated output, or
existing markup) against Schema.org / Google Rich Results requirements,
so a human reviewer knows exactly what's missing before approving it.

## Required vs. recommended, per type

Missing a **required** property means the rich result cannot render at
all — treat it as an error. Missing a **recommended** property only
limits richness — treat it as a warning.

- **Article / BlogPosting / NewsArticle** — required: `headline`, `image`.
  Recommended: `author` (typed node), `publisher`, `datePublished`,
  `dateModified`, `mainEntityOfPage`.
- **Product** — required: `name`, plus at least one of `offers`,
  `review`, or `aggregateRating`. If `offers` is present it needs `price`,
  `priceCurrency`, and `availability`. Recommended: `image`,
  `description`, `brand`, `sku`.
- **FAQPage** — required: `mainEntity` as an array of `Question`, each
  with `name` and `acceptedAnswer.text`. Note in your findings that FAQ
  rich results are largely limited to authoritative gov/health sites now
  — still structurally valid, just may not render for a commercial page.
- **HowTo** — required: `name` and a `step` array where each step has
  `text`.
- **BreadcrumbList** — required: `itemListElement` as ordered `ListItem`s,
  each with a 1-based sequential `position` and a `name`; every item
  except the last also needs an `item` URL.
- **Organization** — required: `name`, `url`. Recommended: `logo`,
  `sameAs`.
- **LocalBusiness** — required: `name`, `address` (with street, locality,
  region, postal code, country). Recommended: `telephone`, `geo`.
- **WebSite** — required: `url`. For the sitelinks search box,
  `potentialAction` (`SearchAction`) needs a `target` containing
  `{search_term_string}`.

## Severity rules

| Severity | When |
|---|---|
| error | A required property for the detected `@type` is missing, or the JSON-LD doesn't parse. |
| warning | A recommended property is missing. |

## Procedure

1. Confirm the JSON-LD parses as valid JSON — a parse failure is an error
   on its own, independent of any property check.
2. Read the `@type` (or each node's `@type` inside a `@graph` array).
3. Walk the required-property list for that type; every missing one is an
   error.
4. Walk the recommended-property list; every missing one is a warning.
5. Flag (as a warning) any property present with an empty string, empty
   array, or null value — that's functionally the same as missing it.
6. Report which Google rich result the type targets (Article, Product
   snippet, FAQ, Breadcrumb, Sitelinks search box) so the reviewer knows
   what's actually at stake if errors aren't fixed.

Do not soften an error into a warning because the rest of the markup looks
otherwise solid — a single missing required property blocks the entire
rich result regardless of how complete everything else is.
