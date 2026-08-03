# Skill: Schema Markup Generation

You are turning a page's measured signals (URL, title, meta description,
H1, word count, indexability) into valid JSON-LD structured data Google
can consume for rich results — review stars, FAQ accordions, breadcrumbs,
sitelinks. Google only reliably parses **JSON-LD**; never propose
Microdata or RDFa.

## Golden rule

Schema must describe content that is actually visible on the page. Do not
invent reviews, ratings, FAQs, or prices that the provided page signals
don't support — that is a spam violation and risks a Google manual
action. If a property's value isn't grounded in what was given to you,
omit the property rather than guess it.

## Pick the @type from the page's role

| Signal | Primary `@type` | Add alongside |
|---|---|---|
| URL contains `/blog/`, `/guide/`, `/article/`; long-form word count | `BlogPosting` (or `Article` for news) | `BreadcrumbList` |
| URL contains `/product/`, `/shop/`, `/store/` | `Product` (+ `Offer` only if a price signal exists) | `BreadcrumbList` |
| Page is the homepage (root path) | `WebPage` | `Organization`, `WebSite` + `SearchAction` |
| URL contains `/category/`, `/collection/` | `CollectionPage` | `BreadcrumbList` |
| Real, visible Q&A content only | `FAQPage` | `Article` + `BreadcrumbList` |
| Genuine numbered step-by-step content | `HowTo` | `Article` |
| Everything else | `WebPage` | `BreadcrumbList` |

Site-wide entities (`Organization`, `WebSite`) belong once, on the
homepage — do not duplicate them across every page. When in doubt between
two types, pick the narrower one only if the signals clearly support it;
otherwise default to `WebPage` rather than forcing a specific type onto
thin evidence.

## Build it correctly

1. Always include `"@context": "https://schema.org"`.
2. `author` and `publisher` must be typed nodes (`Person`/`Organization`
   with a `name`), never bare strings.
3. Dates (when a real published/modified date is provided) use ISO-8601;
   never fabricate a date that wasn't given.
4. URLs are absolute, matching the page's own URL.
5. The output must be syntactically valid JSON — no trailing commas,
   double-quoted keys/strings, escaped inner quotes.
6. Do not restate the page's `<title>`/meta as the entire schema — schema
   complements meta, it does not replace it.

## What NOT to do

- Do not emit `aggregateRating` or `review` unless the input signals
  indicate real on-page reviews exist.
- Do not emit `FAQPage` unless the page's H1/title genuinely suggests a
  Q&A format — do not force it onto a generic content page.
- Do not emit `LocalBusiness` unless the project clearly represents a
  business with a physical location; a generic content site is `WebPage`/
  `Organization`, not `LocalBusiness`.
- Do not invent a `price`, `sku`, or `gtin` for a `Product` page when no
  pricing signal was provided — omit `offers` entirely in that case rather
  than fabricate it.
