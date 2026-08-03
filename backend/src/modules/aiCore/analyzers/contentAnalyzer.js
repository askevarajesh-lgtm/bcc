/**
 * AI Core Analyzers — ContentAnalyzer
 *
 * Reuses `word_count`, `listCount`, `tableCount` already parsed per page by
 * `crawl.service.js`'s `fetchAndParse()`, and the same thin-content
 * threshold (`< 300 words`) `crawl.service.js`'s `buildSummary()` already
 * uses — see architecture plan §2.
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const { safeArray } = require('../utils/array.util');

const NAME = 'ContentAnalyzer';
const VERSION = '1.0.0';

const THIN_CONTENT_THRESHOLD = 300; // matches crawl.service.js buildSummary()

function finding(severity, category, message, pageUrl) {
  return { severity, category, message, pageUrl };
}

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
    let thinContentCount = 0;
    let noStructureCount = 0;
    let totalWordCount = 0;

    indexable.forEach((p) => {
      const wordCount = p.word_count || 0;
      totalWordCount += wordCount;

      if (wordCount < THIN_CONTENT_THRESHOLD) {
        thinContentCount++;
        findings.push(finding('warning', 'content_quality', `Thin content: ${wordCount} words (below ${THIN_CONTENT_THRESHOLD})`, p.url));
      }

      const hasStructure = (p.listCount || 0) > 0 || (p.tableCount || 0) > 0;
      if (wordCount >= THIN_CONTENT_THRESHOLD && !hasStructure) {
        noStructureCount++;
        findings.push(finding('info', 'content_quality', 'Long page has no lists or tables to aid scannability', p.url));
      }
    });

    const total = indexable.length;
    const weightedIssues = thinContentCount * 2 + noStructureCount * 0.5;
    const score = Math.max(0, 100 - (weightedIssues / total) * 10);
    const avgWordCount = Math.round(totalWordCount / total);

    const recommendations = [];
    if (thinContentCount > 0) recommendations.push(`Expand ${thinContentCount} thin-content page(s) below ${THIN_CONTENT_THRESHOLD} words`);
    if (noStructureCount > 0) recommendations.push(`Add lists/tables to ${noStructureCount} long page(s) with none`);

    return {
      source: 'crawl',
      score,
      findings,
      metrics: {
        pagesAnalyzed: total,
        thinContentPages: thinContentCount,
        pagesWithNoStructure: noStructureCount,
        avgWordCount
      },
      warnings: [],
      recommendations,
      raw: null,
      metadata: { totalPages: safeArray(pages).length, thinContentThreshold: THIN_CONTENT_THRESHOLD }
    };
  });
}

module.exports = { run, NAME, VERSION };
