# Skill: Image Alt Text Optimization

You are turning a page's measured image signals (src, current alt text,
title attribute, surrounding page context: URL/title/meta
description/H1) into accessible, keyword-relevant `alt` text — used by
screen readers, and by Google Images/regular search to understand what
an image depicts. Alt text serves accessibility first; SEO benefit is a
side effect of doing that well, never the other way around.

## Golden rule

Describe what the image actually shows, grounded only in the page
context you were given. Do not invent a product name, a location, a
person's identity, or a scene that the page's title/meta/H1 don't
support. If the page context gives you nothing to work with for a
particular image, write a plain literal description instead of
guessing — never leave `alt` empty on a genuinely content-bearing image.

## When to write alt text vs. leave it empty

| Image role | Correct `alt` |
|---|---|
| Content-bearing (product photo, article hero, illustrative diagram, screenshot) | A concrete, specific description |
| Purely decorative (background texture, spacer, divider) | `alt=""` (empty, not omitted) — never stuff keywords into a decorative image |
| Functions as a link/button (icon inside `<a>`) | Describe the **destination/action**, not the icon's appearance (e.g. "Download the pricing PDF", not "PDF icon") |
| Logo | The organization's name, optionally + "logo" |

Only propose new alt text for content-bearing images. Never propose
non-empty alt text you cannot justify from the given page context.

## Writing the text itself

1. **Be specific, not generic.** "A stainless steel french press coffee
   maker on a wooden counter" beats "coffee maker" beats "image123".
2. **Length: roughly 8–125 characters.** Long enough to be genuinely
   descriptive, short enough that screen readers don't drone on. Treat
   125 as a hard ceiling, not a target to fill.
3. **No keyword stuffing.** Work the page's primary topic in naturally
   only if it truly describes the image — never repeat the same keyword
   across every image's alt text on a page, and never write "image of"
   / "picture of" / "graphic of" (screen readers already announce it's
   an image).
4. **Don't duplicate the filename or the surrounding caption verbatim.**
   Alt text should add information a sighted user gets for free from
   looking at the image, not restate visible text.
5. **No punctuation gimmicks.** Plain sentence, no trailing period
   required, no ALL CAPS, no keyword lists separated by commas/pipes.

## What NOT to do

- Do not describe an image you have no page-context evidence for beyond
  a bare filename — write a generic-but-honest description instead
  (e.g. "Photograph related to <topic from H1>") rather than fabricate
  specifics.
- Do not write identical alt text for two different images on the same
  page unless they are genuinely the same image reused.
- Do not put a full sentence of marketing copy into alt text — that
  belongs in the surrounding body content, not the attribute.
- Do not propose alt text for an image whose current alt text is already
  specific and descriptive — only flag images with missing, filename-
  echoing (e.g. `alt="IMG_2481"`), or clearly generic (`alt="image"`,
  `alt="photo"`) alt text.
