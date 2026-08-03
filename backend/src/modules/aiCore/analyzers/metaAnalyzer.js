/**
 * AI Core Analyzers — MetaAnalyzer
 *
 * Reuses the `title`/`meta_description`/`canonical`/`meta_robots` fields
 * `crawl.service.js`'s `fetchAndParse()` already parses per page (see
 * architecture plan §2) — no new parsing, just findings/scoring on top of
 * data CrawlAnalyzer already produced.
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const { safeArray } = require('../utils/array.util');

const NAME = 'MetaAnalyzer';
const VERSION = '1.0.0';

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

function finding(severity, category, message, pageUrl) {
  return { severity, category, message, pageUrl };
}

/**
 * @param {import('../types/analyzer.types').PageRecord[]} pages
 * @returns {Promise<import('../types/analyzer.types').AnalyzerResult>}
 */
async function run(pages) {
  return withAnalyzerContract(NAME, VERSION, async () => {
    const indexable = safeArray(pages).filter((p) => p.status === 200 && p.indexable !== false);

    if (indexable.length === 0) {
      return {
        source: 'crawl',
        score: 0,
        findings: [],
        metrics: { pagesAnalyzed: 0 },
        warnings: ['No indexable pages available to analyze'],
        recommendations: [],
        raw: null,
        metadata: { totalPages: safeArray(pages).length }
      };
    }

    const findings = [];
    const counts = {
      missingTitle: 0, longTitle: 0, shortTitle: 0,
      missingDescription: 0, longDescription: 0, shortDescription: 0,
      missingCanonical: 0, noindexPages: 0
    };

    indexable.forEach((p) => {
      const title = (p.title || '').trim();
      const description = (p.meta_description || '').trim();

      if (!title) {
        counts.missingTitle++;
        findings.push(finding('critical', 'meta_title', 'Page is missing a <title> tag', p.url));
      } else if (title.length > TITLE_MAX) {
        counts.longTitle++;
        findings.push(finding('warning', 'meta_title', `Title exceeds ${TITLE_MAX} characters (${title.length})`, p.url));
      } else if (title.length < TITLE_MIN) {
        counts.shortTitle++;
        findings.push(finding('info', 'meta_title', `Title is shorter than ${TITLE_MIN} characters (${title.length})`, p.url));
      }

      if (!description) {
        counts.missingDescription++;
        findings.push(finding('critical', 'meta_description', 'Page is missing a meta description', p.url));
      } else if (description.length > DESC_MAX) {
        counts.longDescription++;
        findings.push(finding('warning', 'meta_description', `Meta description exceeds ${DESC_MAX} characters (${description.length})`, p.url));
      } else if (description.length < DESC_MIN) {
        counts.shortDescription++;
        findings.push(finding('info', 'meta_description', `Meta description is shorter than ${DESC_MIN} characters (${description.length})`, p.url));
      }

      if (!(p.canonical || '').trim()) {
        counts.missingCanonical++;
        findings.push(finding('info', 'canonical', 'Page is missing a canonical tag', p.url));
      }

      if ((p.meta_robots || '').toLowerCase().includes('noindex')) {
        counts.noindexPages++;
      }
    });

    const total = indexable.length;
    const weightedIssues =
      counts.missingTitle * 3 +
      counts.missingDescription * 2 +
      counts.longTitle + counts.shortTitle +
      counts.longDescription + counts.shortDescription +
      counts.missingCanonical * 0.5;
    const score = Math.max(0, 100 - (weightedIssues / total) * 10);

    const recommendations = [];
    if (counts.missingTitle > 0) recommendations.push(`Add unique <title> tags to ${counts.missingTitle} page(s) missing one`);
    if (counts.missingDescription > 0) recommendations.push(`Add meta descriptions to ${counts.missingDescription} page(s) missing one`);
    if (counts.longTitle > 0) recommendations.push(`Shorten ${counts.longTitle} title(s) exceeding ${TITLE_MAX} characters`);
    if (counts.missingCanonical > 0) recommendations.push(`Add canonical tags to ${counts.missingCanonical} page(s) missing one`);

    return {
      source: 'crawl',
      score,
      findings,
      metrics: { pagesAnalyzed: total, ...counts },
      warnings: [],
      recommendations,
      raw: null,
      metadata: { totalPages: safeArray(pages).length }
    };
  });
}

module.exports = { run, NAME, VERSION };
