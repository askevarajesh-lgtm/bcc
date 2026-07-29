/**
 * AI Core Analyzers — LinkAnalyzer
 *
 * Centralizes the link-graph logic that today lives inline in
 * `seoWorkspace/services/internalLinkingAgent.service.js`
 * (`normalizeUrl`, `pairKey`, orphan/outbound-link graph building) — see
 * architecture plan §2. That agent still owns AI-generated link
 * *suggestions*; this analyzer only reports the objective, code-measured
 * state of the link graph (orphan pages, inbound/outbound counts).
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const { safeArray } = require('../utils/array.util');
const { normalizeUrl, toAbsoluteHttpUrl } = require('../utils/url.util');

const NAME = 'LinkAnalyzer';
const VERSION = '1.0.0';

function finding(severity, category, message, pageUrl) {
  return { severity, category, message, pageUrl };
}

/**
 * @param {import('../types/analyzer.types').PageRecord[]} pages
 * @param {Object} [options]
 * @param {string} [options.siteUrl] - used to identify the homepage so it's never flagged as an orphan
 */
async function run(pages, options = {}) {
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

    const normalizedRoot = options.siteUrl ? normalizeUrl(toAbsoluteHttpUrl(options.siteUrl)) : null;
    const crawledUrlSet = new Set(indexable.map((p) => normalizeUrl(p.final_url || p.url)));
    const outboundByUrl = new Map();
    const inboundCounts = new Map();

    indexable.forEach((p) => {
      const from = normalizeUrl(p.final_url || p.url);
      const toSet = new Set();
      safeArray(p.links).forEach((link) => {
        const to = normalizeUrl(link);
        if (to && to !== from && crawledUrlSet.has(to)) toSet.add(to);
      });
      const outbound = Array.from(toSet);
      outboundByUrl.set(from, outbound);
      outbound.forEach((to) => inboundCounts.set(to, (inboundCounts.get(to) || 0) + 1));
    });

    const findings = [];
    let orphanCount = 0;
    let noOutboundCount = 0;
    let totalOutbound = 0;

    indexable.forEach((p) => {
      const url = normalizeUrl(p.final_url || p.url);
      const inbound = inboundCounts.get(url) || 0;
      const outbound = outboundByUrl.get(url) || [];
      const isHomepage = normalizedRoot ? url === normalizedRoot : false;

      totalOutbound += outbound.length;

      if (!isHomepage && inbound === 0) {
        orphanCount++;
        findings.push(finding('warning', 'internal_links', 'Page has no internal inbound links (orphan page)', url));
      }
      if (outbound.length === 0) {
        noOutboundCount++;
        findings.push(finding('info', 'internal_links', 'Page has no internal outbound links', url));
      }
    });

    const total = indexable.length;
    const weightedIssues = orphanCount * 2 + noOutboundCount;
    const score = Math.max(0, 100 - (weightedIssues / total) * 10);

    const recommendations = [];
    if (orphanCount > 0) recommendations.push(`Add internal links pointing to ${orphanCount} orphan page(s)`);
    if (noOutboundCount > 0) recommendations.push(`Add outbound internal links from ${noOutboundCount} page(s) with none`);

    return {
      source: 'crawl',
      score,
      findings,
      metrics: {
        pagesAnalyzed: total,
        orphanPages: orphanCount,
        pagesWithNoOutboundLinks: noOutboundCount,
        avgOutboundLinksPerPage: total > 0 ? Number((totalOutbound / total).toFixed(2)) : 0
      },
      warnings: [],
      recommendations,
      raw: null,
      metadata: { totalPages: safeArray(pages).length }
    };
  });
}

module.exports = { run, NAME, VERSION };
