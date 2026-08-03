/**
 * AI Core Analyzers — ScoreCalculator
 *
 * New — no existing equivalent. `WorkspaceAudit.metrics.overall` today is an
 * inline 2-4-field average computed by hand inside
 * `seoWorkspace/services/seoAuditorAgent.js`; this becomes the one real
 * aggregate (see architecture plan §2, §4).
 *
 * Deterministic weighted average, not AI-generated, so results are
 * reproducible and cacheable. Weights are a starting proposal, easy to
 * change in this one file since nothing else hardcodes them.
 */
const { createAnalyzerResult } = require('../contracts/analyzerResult.contract');

const NAME = 'ScoreCalculator';
const VERSION = '1.0.0';

const DEFAULT_WEIGHTS = {
  meta: 15,
  heading: 10,
  schema: 15,
  link: 10,
  image: 10,
  content: 15,
  performance: 25
};

/**
 * @param {Object} analyzerResults - keyed by { meta, heading, schema, link, image, content, performance },
 *   each value an AnalyzerResult (or null/undefined if that analyzer didn't run)
 * @param {Object} [weights] - override DEFAULT_WEIGHTS; must sum to 100 to keep `overall` on a 0-100 scale
 * @returns {import('../types/analyzer.types').AnalyzerResult} `metrics.overall` and `metadata.breakdown`/`metadata.weights` hold the aggregate
 */
function run(analyzerResults = {}, weights = DEFAULT_WEIGHTS) {
  const startedAt = new Date().toISOString();

  const breakdown = {};
  const warnings = [];
  let weightedSum = 0;
  let weightUsed = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    const result = analyzerResults[key];
    const score = result && typeof result.score === 'number' ? result.score : null;
    breakdown[key] = score;

    if (score === null) {
      warnings.push(`No score available for "${key}" — excluded from the weighted average`);
      return;
    }
    weightedSum += score * weight;
    weightUsed += weight;
  });

  const overall = weightUsed > 0 ? Math.round(weightedSum / weightUsed) : 0;
  const finishedAt = new Date().toISOString();

  return createAnalyzerResult({
    analyzer: NAME,
    version: VERSION,
    startedAt,
    finishedAt,
    source: 'internal',
    score: overall,
    findings: [],
    metrics: { overall, breakdown },
    warnings,
    recommendations: [],
    raw: null,
    metadata: { weights, weightUsed }
  });
}

module.exports = { run, NAME, VERSION, DEFAULT_WEIGHTS };
