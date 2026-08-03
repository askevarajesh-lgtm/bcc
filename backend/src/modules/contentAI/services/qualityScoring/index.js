/**
 * ContentAI Quality Scoring — orchestrator.
 *
 * Runs only the axes a given generator declares in its `qualityAxes` array
 * (see generators/registry.js), in parallel, and computes a weighted
 * `overall`. No generator is scored on axes that don't apply to it (e.g.
 * Alt Text Generator never runs Conversion scoring).
 */
const seoScorer = require('./seoScorer');
const readabilityScorer = require('./readabilityScorer');
const grammarScorer = require('./grammarScorer');
const conversionScorer = require('./conversionScorer');
const aiConfidenceScorer = require('./aiConfidenceScorer');

const SCORERS = {
  seo: seoScorer,
  readability: readabilityScorer,
  grammar: grammarScorer,
  conversion: conversionScorer,
  aiConfidence: aiConfidenceScorer
};

// Per-axis weight when computing `overall`. Generator-specific emphasis
// (e.g. Product Writer weighting Conversion highest) is handled by only
// including the axes that generator declares — the relative weights below
// then apply across whatever subset is present.
const DEFAULT_WEIGHTS = { seo: 1, readability: 1, grammar: 1, conversion: 1.2, aiConfidence: 0.8 };

/**
 * @param {string[]} axes - e.g. ['seo','readability','grammar','conversion','aiConfidence']
 * @param {Object} payload - the generator's structured output
 * @param {Object} context - { workspaceId, model, contentPieceId, originalPrompt }
 */
async function scoreContent(axes, payload, context) {
  const applicableAxes = (axes || []).filter((a) => SCORERS[a]);

  const results = await Promise.all(
    applicableAxes.map(async (axis) => {
      const result = await SCORERS[axis].score(payload, context);
      return [axis, result];
    })
  );

  const scoreObject = {};
  results.forEach(([axis, result]) => { scoreObject[axis] = result; });

  const numeric = results.filter(([, r]) => typeof r.score === 'number');
  let overall = null;
  if (numeric.length) {
    const weightedSum = numeric.reduce((sum, [axis, r]) => sum + r.score * (DEFAULT_WEIGHTS[axis] || 1), 0);
    const weightTotal = numeric.reduce((sum, [axis]) => sum + (DEFAULT_WEIGHTS[axis] || 1), 0);
    overall = Math.round(weightedSum / weightTotal);
  }

  return { ...scoreObject, overall };
}

module.exports = { scoreContent, SCORERS };
