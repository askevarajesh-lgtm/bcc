/**
 * AI Core Analyzers — CrawlAnalyzer
 *
 * Wraps `CrawlService` unchanged (see architecture plan §3 for the one
 * additive `record.jsonLd` field on `crawl.service.js`). This is the single
 * entry point that fetches page data; every other page-based analyzer
 * (Meta/Heading/Link/Image/Schema/Content) receives its `pages` array from
 * here rather than crawling independently.
 *
 * `score` is intentionally `null` — a crawl isn't itself a scored quality
 * dimension, it's the data source the other analyzers score against.
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const crawlProvider = require('../providers/crawlProvider');

const NAME = 'CrawlAnalyzer';
const VERSION = '1.0.0';

/**
 * @param {string} siteUrl
 * @param {Object} [options]
 * @param {number} [options.limit=50]
 * @returns {Promise<import('../types/analyzer.types').AnalyzerResult>} raw.pages / raw.summary carry the crawl output
 */
async function run(siteUrl, options = {}) {
  return withAnalyzerContract(NAME, VERSION, async () => {
    const limit = options.limit || 50;
    const { summary, pages } = await crawlProvider.crawlSite(siteUrl, { limit, retries: options.retries ?? 1 });
    const safePages = Array.isArray(pages) ? pages : [];
    const warnings = [];
    if (safePages.length === 0) warnings.push('Crawl returned zero pages');

    return {
      source: safePages.length > 0 ? 'crawl' : 'unavailable',
      score: null,
      findings: [],
      metrics: summary || {},
      warnings,
      recommendations: [],
      raw: { pages: safePages, summary: summary || null },
      metadata: { siteUrl, limit, pageCount: safePages.length }
    };
  });
}

module.exports = { run, NAME, VERSION };
