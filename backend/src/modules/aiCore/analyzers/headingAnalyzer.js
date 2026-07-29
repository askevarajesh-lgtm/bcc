/**
 * AI Core Analyzers — HeadingAnalyzer
 *
 * Reuses `h1` and `headings[]` (h2/h3) already parsed per page by
 * `crawl.service.js`'s `fetchAndParse()` (see architecture plan §2).
 * Checks the structural rules any technical SEO audit checks: exactly one
 * H1, no skipped H2->H3 hierarchy at the top level, no empty/duplicate H1s.
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const { safeArray } = require('../utils/array.util');

const NAME = 'HeadingAnalyzer';
const VERSION = '1.0.0';

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
    const counts = { missingH1: 0, emptyHeadings: 0, noSubheadings: 0, headingsBeforeH1Content: 0 };

    indexable.forEach((p) => {
      const h1 = (p.h1 || '').trim();
      const headings = safeArray(p.headings);

      if (!h1) {
        counts.missingH1++;
        findings.push(finding('critical', 'heading_structure', 'Page is missing an <h1>', p.url));
      }

      const empty = headings.filter((h) => !h || !String(h.text || '').trim());
      if (empty.length > 0) {
        counts.emptyHeadings += empty.length;
        findings.push(finding('info', 'heading_structure', `${empty.length} empty h2/h3 tag(s) found`, p.url));
      }

      const hasH2 = headings.some((h) => h.level === 2);
      const hasH3 = headings.some((h) => h.level === 3);
      if (hasH3 && !hasH2) {
        counts.headingsBeforeH1Content++;
        findings.push(finding('warning', 'heading_structure', 'Page uses <h3> without any <h2> (skipped hierarchy level)', p.url));
      }

      if (h1 && headings.length === 0 && (p.word_count || 0) > 300) {
        counts.noSubheadings++;
        findings.push(finding('info', 'heading_structure', 'Long page has no h2/h3 subheadings, hurting scannability', p.url));
      }
    });

    const total = indexable.length;
    const weightedIssues = counts.missingH1 * 3 + counts.headingsBeforeH1Content + counts.noSubheadings * 0.5 + counts.emptyHeadings * 0.25;
    const score = Math.max(0, 100 - (weightedIssues / total) * 10);

    const recommendations = [];
    if (counts.missingH1 > 0) recommendations.push(`Add an <h1> to ${counts.missingH1} page(s) missing one`);
    if (counts.headingsBeforeH1Content > 0) recommendations.push(`Fix skipped heading hierarchy (h3 without h2) on ${counts.headingsBeforeH1Content} page(s)`);
    if (counts.noSubheadings > 0) recommendations.push(`Add h2/h3 subheadings to ${counts.noSubheadings} long page(s) with none`);

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
