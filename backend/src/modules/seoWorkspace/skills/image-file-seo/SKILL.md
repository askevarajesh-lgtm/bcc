# Skill: Image File SEO

You are reviewing an image's *file-level* signals — its URL/filename,
whether width/height attributes are present, and its position on the
page (hero/above-the-fold vs. deep in the content) — and proposing
technical fixes that are independent of what the image alt-text
methodology covers. This skill never touches `alt` text; it only
covers the filename slug and the loading/rendering attributes.

## Filename slugs

A crawled image URL like `/uploads/IMG_2481.JPG` or
`/wp-content/uploads/2024/03/image-1(2).png` gives Google's image
indexer nothing to go on. Propose a replacement **slug** (not a full
URL — the site's path structure is not yours to redesign) that is:

1. **Descriptive**, grounded in the same page context used for alt text
   (page title/H1/primary topic) — never invented.
2. **Lowercase, hyphen-separated**, no underscores, no spaces, no
   parentheses, no query strings, no consecutive hyphens.
3. **Short** — 3-6 meaningful words, not a full sentence.
4. **Extension preserved exactly** (`.jpg` stays `.jpg`; do not change
   `.jpg`↔`.jpeg` or recommend a format conversion here — format/
   compression is a performance concern, not a filename concern, and
   isn't visible from a filename alone).

Only flag a filename as needing a rename when it is clearly
non-descriptive: a camera default pattern (`IMG_1234`, `DSC00234`,
`Screenshot_2024...`), a bare CMS-generated hash/number
(`image1`, `photo`, `12345678`), or contains raw spaces/parentheses
that break URL hygiene. Do **not** flag a filename that is already a
reasonable, readable slug even if it could theoretically be more
specific — this must stay a precision tool, not a rename-everything
pass.

## Loading & layout signals

From the crawled `width`/`height` attribute presence alone (not actual
pixel dimensions, which the crawl doesn't measure) you can flag:

- **Missing both `width` and `height` attributes** on a content image —
  this is a Cumulative Layout Shift (CLS) risk; the browser can't
  reserve space before the image loads. Recommend adding explicit
  `width`/`height` (or a CSS `aspect-ratio`) matching the image's actual
  rendered size — you don't know the actual pixel values from a crawl,
  so say so rather than inventing numbers.
- **A large number of images with no visible `loading` attribute** on a
  long page — recommend `loading="lazy"` for below-the-fold images
  (never for the hero/first-viewport image; lazy-loading that one hurts
  LCP instead of helping it).

## What NOT to do

- Do not recommend converting image formats (WebP/AVIF) or compressing
  file sizes — the crawl doesn't measure actual bytes-on-disk or
  format, so any such claim would be fabricated. Say explicitly that
  format/size cannot be assessed from a crawl and would need a
  dedicated performance audit (Core Web Vitals skill) if the caller
  needs that.
- Do not propose a full new URL/path — only the filename slug segment.
- Do not rename a filename that is already descriptive just to add
  more keywords — that is keyword stuffing in the URL, not optimization.
- Do not recommend `loading="lazy"` for an image that is plausibly the
  page's hero/LCP image.
