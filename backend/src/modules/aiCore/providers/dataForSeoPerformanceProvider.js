/**
 * AI Core — DataForSEO Performance Provider
 *
 * Fallback path for `PerformanceAnalyzer` when PSI fails/times out/rate-limits.
 * Wraps the existing `seoIntelligence/dataForSeo.service.js` `runOnPageAudit()`
 * unchanged and normalizes its `page_metrics` into the same
 * `{ score, coreWebVitals, raw }` shape the PSI provider returns, so
 * `PerformanceAnalyzer` doesn't need to know which one ran.
 */
const dataForSeoService = require('../../seoIntelligence/dataForSeo.service');

/**
 * @param {string} siteUrl
 * @param {Object} [options]
 * @param {number} [options.maxCrawlPages=5]
 * @returns {Promise<{ score: number|null, coreWebVitals: { lcp: number|null, fid_or_inp: number|null, cls: number|null }, raw: Object }|null>}
 */
async function fetchPerformance(siteUrl, options = {}) {
  const { maxCrawlPages = 5 } = options;

  if (!dataForSeoService.isConfigured) return null;

  const outcome = await dataForSeoService.runOnPageAudit(siteUrl, maxCrawlPages);
  const metrics = outcome?.result?.page_metrics;
  if (!metrics) return null;

  return {
    score: metrics.onpage_score !== undefined && metrics.onpage_score !== null
      ? Math.round(metrics.onpage_score)
      : null,
    // DataForSEO's on-page summary doesn't return lab Core Web Vitals in this
    // call — null fields here (per the pipeline contract's "null if source
    // didn't provide them") rather than fabricating values.
    coreWebVitals: { lcp: null, fid_or_inp: null, cls: null },
    raw: metrics
  };
}

module.exports = { fetchPerformance };
