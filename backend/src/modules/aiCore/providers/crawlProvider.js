/**
 * AI Core — Crawl Provider
 *
 * Wraps the existing, unmodified `CrawlService` (see the architecture plan
 * §3 for the one additive `record.jsonLd` field). This is the only place in
 * `aiCore/analyzers/` that talks to `CrawlService` directly — `CrawlAnalyzer`
 * calls this, every other analyzer receives already-crawled `pages`.
 */
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const retry = require('../retry.service');
const logger = require('../logger.service');

const TAG = 'CrawlProvider';

/**
 * @param {string} siteUrl
 * @param {Object} [options]
 * @param {number} [options.limit=50]
 * @param {number} [options.retries=1]
 * @returns {Promise<{ summary: Object|null, pages: import('../types/analyzer.types').PageRecord[] }>}
 */
async function crawlSite(siteUrl, options = {}) {
  const { limit = 50, retries = 1 } = options;

  return retry
    .withRetry(() => new CrawlService(siteUrl, limit).run(), { retries })
    .catch((error) => {
      logger.warn(TAG, `Crawl failed for ${siteUrl}, continuing with an empty page set: ${error.message}`);
      return { summary: null, pages: [] };
    });
}

module.exports = { crawlSite };
