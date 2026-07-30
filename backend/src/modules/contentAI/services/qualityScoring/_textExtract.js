/**
 * Shared "pull all human-readable prose out of a generator payload"
 * helper — used by readabilityScorer, grammarScorer, and conversionScorer
 * so none of them has to know each generator's exact output shape.
 * Skips obvious non-prose fields (urls, slugs, schema types) by field name.
 */
const SKIP_KEYS = new Set([
  'url', 'href', 'ctaHref', 'targetUrl', 'blockType', 'schemaType', '@context', '@type', 'icon'
]);

function extractProse(value, out = [], depth = 0) {
  if (depth > 8 || value === null || value === undefined) return out;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 1) out.push(trimmed);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => extractProse(v, out, depth + 1));
    return out;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, v]) => {
      if (SKIP_KEYS.has(key)) return;
      extractProse(v, out, depth + 1);
    });
  }
  return out;
}

function proseText(payload) {
  return extractProse(payload).join(' ');
}

module.exports = { proseText };
