/**
 * AI Core — Analyzer Result Contract
 *
 * One standardized shape every analyzer in `aiCore/analyzers/` returns (see
 * `types/analyzer.types.js` for the full JSDoc typedef):
 *
 *   { analyzer, version, startedAt, finishedAt, duration, source,
 *     score, findings, metrics, warnings, recommendations, raw, metadata }
 *
 * `withAnalyzerContract` is the piece every analyzer actually calls: it
 * times the analyzer's core logic and — critically — catches any error the
 * analyzer throws and converts it into a well-formed, degraded
 * AnalyzerResult (`source: 'unavailable'`, `score: 0`, a `findings` entry
 * describing the failure) instead of throwing. That's what lets
 * `analyzerPipeline`/`execution/parallelExecutor` run analyzers in parallel
 * and have one analyzer's failure never take down the others or the overall
 * pipeline run.
 */
const { nowIso, durationMs } = require('../utils/timing.util');

const DEFAULT_VERSION = '1.0.0';
const VALID_SOURCES = new Set(['crawl', 'psi', 'dataforseo', 'internal', 'unavailable']);

function clampScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fills in defaults and normalizes a partial result into the full contract
 * shape. Safe to call directly for analyzers that want to build their own
 * result (e.g. ScoreCalculator, which doesn't fit the "wrap and catch" model
 * of `withAnalyzerContract` since it aggregates other results instead of
 * fetching its own data).
 *
 * @param {Object} partial
 * @returns {import('../types/analyzer.types').AnalyzerResult}
 */
function createAnalyzerResult(partial = {}) {
  const {
    analyzer,
    version = DEFAULT_VERSION,
    startedAt = nowIso(),
    finishedAt = nowIso(),
    source = 'internal',
    score = null,
    findings = [],
    metrics = {},
    warnings = [],
    recommendations = [],
    raw = null,
    metadata = {}
  } = partial;

  if (!analyzer) throw new Error('createAnalyzerResult: "analyzer" name is required');

  return {
    analyzer,
    version,
    startedAt,
    finishedAt,
    duration: durationMs(startedAt, finishedAt),
    source: VALID_SOURCES.has(source) ? source : 'internal',
    score: score === null || score === undefined ? null : clampScore(score),
    findings: Array.isArray(findings) ? findings : [],
    metrics: metrics && typeof metrics === 'object' ? metrics : {},
    warnings: Array.isArray(warnings) ? warnings : [],
    recommendations: Array.isArray(recommendations) ? recommendations : [],
    raw: raw === undefined ? null : raw,
    metadata: metadata && typeof metadata === 'object' ? metadata : {}
  };
}

/**
 * @param {string} analyzer - analyzer name, e.g. 'MetaAnalyzer'
 * @param {string} version - e.g. '1.0.0'
 * @param {() => Promise<Object>} fn - core analyzer logic; must resolve with
 *   a partial result object (source/score/findings/metrics/... minus
 *   analyzer/version/startedAt/finishedAt, which this wrapper fills in)
 * @returns {Promise<import('../types/analyzer.types').AnalyzerResult>}
 */
async function withAnalyzerContract(analyzer, version, fn) {
  const startedAt = nowIso();
  try {
    const partial = await fn();
    const finishedAt = nowIso();
    return createAnalyzerResult({ analyzer, version, startedAt, finishedAt, ...partial });
  } catch (error) {
    const finishedAt = nowIso();
    return createAnalyzerResult({
      analyzer,
      version,
      startedAt,
      finishedAt,
      source: 'unavailable',
      score: 0,
      findings: [{
        severity: 'error',
        category: 'analyzer_failure',
        message: `${analyzer} failed: ${error.message}`,
        pageUrl: null
      }],
      warnings: [error.message],
      metadata: { failed: true }
    });
  }
}

module.exports = { createAnalyzerResult, withAnalyzerContract, clampScore, DEFAULT_VERSION };
