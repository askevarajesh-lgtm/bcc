/**
 * ContentAI Quality Scoring — SEO axis.
 *
 * Deterministic, no AI call. Reuses `aiCore/analyzers/metaAnalyzer.js` and
 * `schemaAnalyzer.js` directly — the SAME scoring rules the crawl-based SEO
 * audits already use — by feeding them a synthetic single-page `PageRecord`
 * built from the generated content, instead of a crawled page. This is a
 * different data SOURCE into an unmodified analyzer, not a second rule set.
 */
const metaAnalyzer = require('../../../aiCore/analyzers/metaAnalyzer');
const schemaAnalyzer = require('../../../aiCore/analyzers/schemaAnalyzer');

function extractMetaFromPayload(payload) {
  return {
    title: payload.metaTitle || payload.title || '',
    description: payload.metaDescription || payload.excerpt || ''
  };
}

function extractJsonLdFromPayload(payload) {
  if (payload.jsonLd) return [payload.jsonLd];
  if (payload.schemaMarkup) return [payload.schemaMarkup];
  return [];
}

/**
 * @param {Object} payload - a generator's structured output (ContentVersion.payload)
 * @returns {Promise<{score: number, findings: string[]}>}
 */
async function score(payload = {}) {
  const meta = extractMetaFromPayload(payload);
  const jsonLd = extractJsonLdFromPayload(payload);

  const syntheticPage = {
    url: 'draft://content-piece',
    status: 200,
    indexable: true,
    title: meta.title,
    meta_description: meta.description,
    jsonLd
  };

  const [metaResult, schemaResult] = await Promise.all([
    metaAnalyzer.run([syntheticPage]),
    schemaAnalyzer.run([syntheticPage])
  ]);

  const findings = [
    ...metaResult.findings.map((f) => f.message),
    ...(jsonLd.length ? schemaResult.findings.map((f) => f.message) : [])
  ];

  // If this piece carries no meta/schema fields at all (e.g. a CTA or an
  // internal-link suggestion), meta/schema scoring isn't meaningful —
  // return null rather than a misleadingly low/high number.
  const hasMeta = Boolean(meta.title || meta.description);
  const hasSchema = jsonLd.length > 0;
  if (!hasMeta && !hasSchema) {
    return { score: null, findings: [] };
  }

  const parts = [];
  if (hasMeta) parts.push(metaResult.score);
  if (hasSchema) parts.push(schemaResult.score);
  const combined = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  return { score: combined, findings };
}

module.exports = { score };
