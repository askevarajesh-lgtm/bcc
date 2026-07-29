/**
 * AI Core Analyzers — PerformanceAnalyzer
 *
 * Normalizes the PSI call pattern (from the older
 * `seoIntelligence/services/audit.service.js`) and
 * `dataForSeoService.runOnPageAudit()` into one contract — see architecture
 * plan §4.
 *
 * Logic: try PSI with a bounded timeout -> on failure/timeout/rate-limit,
 * fall back to DataForSEO's `page_metrics` -> if both fail, return
 * `source: 'unavailable'` with a neutral score and a finding flagging that
 * performance couldn't be measured. Unlike the old `audit.service.js`'s
 * hardcoded `65` fallback, this never silently fabricates a number.
 */
const { withAnalyzerContract } = require('../contracts/analyzerResult.contract');
const psiProvider = require('../providers/psiProvider');
const dataForSeoPerformanceProvider = require('../providers/dataForSeoPerformanceProvider');
const logger = require('../logger.service');

const NAME = 'PerformanceAnalyzer';
const VERSION = '1.0.0';
const NEUTRAL_SCORE = 50; // documented "we don't know" midpoint, never presented as measured

function finding(severity, category, message, pageUrl) {
  return { severity, category, message, pageUrl };
}

/**
 * @param {string} siteUrl
 * @param {Object} [options]
 * @param {'desktop'|'mobile'} [options.strategy='desktop']
 * @param {number} [options.psiTimeoutMs=12000]
 * @returns {Promise<import('../types/analyzer.types').AnalyzerResult>}
 */
async function run(siteUrl, options = {}) {
  return withAnalyzerContract(NAME, VERSION, async () => {
    const strategy = options.strategy || 'desktop';
    const psiTimeoutMs = options.psiTimeoutMs || 12000;

    try {
      const psiResult = await psiProvider.fetchPsi(siteUrl, { strategy, timeoutMs: psiTimeoutMs });
      if (psiResult.score !== null) {
        return buildResult('psi', psiResult, siteUrl);
      }
      logger.warn(NAME, `PSI returned no performance score for ${siteUrl}, falling back to DataForSEO`);
    } catch (error) {
      logger.warn(NAME, `PSI failed for ${siteUrl}: ${error.message}, falling back to DataForSEO`);
    }

    try {
      const dfsResult = await dataForSeoPerformanceProvider.fetchPerformance(siteUrl);
      if (dfsResult && dfsResult.score !== null) {
        return buildResult('dataforseo', dfsResult, siteUrl);
      }
    } catch (error) {
      logger.warn(NAME, `DataForSEO performance fallback failed for ${siteUrl}: ${error.message}`);
    }

    return {
      source: 'unavailable',
      score: NEUTRAL_SCORE,
      findings: [finding('warning', 'performance', 'Performance could not be measured (PSI and DataForSEO both unavailable)', siteUrl)],
      metrics: { coreWebVitals: { lcp: null, fid_or_inp: null, cls: null } },
      warnings: ['Both PSI and DataForSEO performance sources failed or returned no data'],
      recommendations: [],
      raw: null,
      metadata: { siteUrl, strategy }
    };
  });
}

function buildResult(source, providerResult, siteUrl) {
  const findings = [];
  const { lcp, fid_or_inp, cls } = providerResult.coreWebVitals || {};
  if (lcp !== null && lcp !== undefined && lcp > 2500) {
    findings.push(finding('warning', 'performance', `Largest Contentful Paint is slow (${Math.round(lcp)}ms, target < 2500ms)`, siteUrl));
  }
  if (cls !== null && cls !== undefined && cls > 0.1) {
    findings.push(finding('warning', 'performance', `Cumulative Layout Shift is high (${cls}, target < 0.1)`, siteUrl));
  }
  if (providerResult.score !== null && providerResult.score < 50) {
    findings.push(finding('critical', 'performance', `Overall performance score is low (${providerResult.score}/100)`, siteUrl));
  }

  return {
    source,
    score: providerResult.score,
    findings,
    metrics: { coreWebVitals: providerResult.coreWebVitals || { lcp: null, fid_or_inp: null, cls: null } },
    warnings: [],
    recommendations: findings.length > 0 ? ['Review Core Web Vitals and address flagged performance issues'] : [],
    raw: providerResult.raw || null,
    metadata: { siteUrl }
  };
}

module.exports = { run, NAME, VERSION };
