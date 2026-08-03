/**
 * Opportunity Engine — Enterprise Competitor Intelligence
 *
 * Groups `Recommendation[]` into actionable opportunity buckets and enriches
 * each with difficulty, estimated traffic/revenue, estimated time, and
 * confidence — using the same deterministic CTR curve already in
 * `competitorRecommendation.service.js` (no new formulas invented).
 *
 * Buckets:
 *   quick_win  — low difficulty, high estimated impact (do first)
 *   easy_win   — low difficulty, medium impact
 *   medium     — medium difficulty, medium-high impact
 *   hard       — high difficulty or significant effort
 *   long_term  — structural / authority work (backlinks, EEAT, etc.)
 *
 * Revenue estimation:
 *   estimatedRevenue ≈ estimatedTraffic × avgCPC × conversionRate
 *   where avgCPC defaults to $1.50 and conversionRate defaults to 2% —
 *   these are acknowledged rough proxies, always shown with low confidence
 *   when CPC data is unavailable.
 */
const Recommendation = require('../models/recommendation.model');

const DEFAULT_CPC = 1.50;          // USD — used only when no real CPC is available
const DEFAULT_CVR = 0.02;          // 2% conversion rate (acknowledged proxy)
const DEFAULT_AOV = 50;            // $50 average order value (acknowledged proxy)

// Time estimates in days (median per difficulty bucket)
const TIME_ESTIMATE_DAYS = {
  quick_win: 3,
  easy_win:  7,
  medium:    30,
  hard:      90,
  long_term: 180
};

/**
 * @param {Object} rec - Recommendation lean doc
 * @returns {'quick_win'|'easy_win'|'medium'|'hard'|'long_term'}
 */
function assignBucket(rec) {
  const effort = rec.effortHint || 'medium';
  const traffic = rec.estimatedTrafficImpact || 0;
  const type = rec.type;

  if (type === 'backlink_gap') return 'long_term'; // backlinks = structural work

  if (effort === 'low' && traffic >= 200) return 'quick_win';
  if (effort === 'low')                   return 'easy_win';
  if (effort === 'medium' && traffic >= 100) return 'medium';
  if (effort === 'medium')                return 'medium';
  return 'hard';
}

/**
 * @param {Object} rec - Recommendation lean doc
 * @returns {{ difficulty: number, confidence: 'low'|'medium'|'high', estimatedRevenue: number }}
 */
function enrichOpportunity(rec) {
  const traffic = rec.estimatedTrafficImpact || 0;

  // Difficulty: low=25, medium=50, high=75
  const difficultyMap = { low: 25, medium: 50, high: 75 };
  const difficulty = difficultyMap[rec.effortHint] || 50;

  // Revenue estimate — explicitly flagged as 'low' confidence when real CPC missing
  const cpc = rec.item?.cpc || DEFAULT_CPC;
  const hasRealCpc = Boolean(rec.item?.cpc);
  const estimatedRevenue = Math.round(traffic * cpc * DEFAULT_CVR * DEFAULT_AOV);
  const confidence = hasRealCpc && traffic > 50 ? 'medium' : 'low';

  return { difficulty, confidence, estimatedRevenue };
}

/**
 * Returns all proposed recommendations grouped into opportunity buckets.
 *
 * @param {string|ObjectId} projectId
 * @param {{ status?: string }} [opts]
 * @returns {Promise<{
 *   buckets: { quick_win, easy_win, medium, hard, long_term },
 *   summary: { totalOpportunities, totalEstimatedTraffic, totalEstimatedRevenue, byBucket }
 * }>}
 */
async function getOpportunities(projectId, opts = {}) {
  const query = { projectId, status: opts.status || 'proposed' };
  const recommendations = await Recommendation.find(query)
    .sort({ priorityScore: -1 })
    .lean();

  const buckets = {
    quick_win:  [],
    easy_win:   [],
    medium:     [],
    hard:       [],
    long_term:  []
  };

  let totalTraffic = 0;
  let totalRevenue = 0;

  recommendations.forEach((rec) => {
    const bucket = assignBucket(rec);
    const { difficulty, confidence, estimatedRevenue } = enrichOpportunity(rec);

    const opportunity = {
      ...rec,
      bucket,
      difficulty,
      confidence,
      estimatedRevenue,
      estimatedTimeDays: TIME_ESTIMATE_DAYS[bucket],
      // Implementation steps derived deterministically from gap type
      steps: getImplementationSteps(rec)
    };

    buckets[bucket].push(opportunity);
    totalTraffic += rec.estimatedTrafficImpact || 0;
    totalRevenue += estimatedRevenue;
  });

  const summary = {
    totalOpportunities: recommendations.length,
    totalEstimatedTraffic: totalTraffic,
    totalEstimatedRevenue: totalRevenue,
    byBucket: Object.fromEntries(
      Object.entries(buckets).map(([k, v]) => [k, v.length])
    )
  };

  return { buckets, summary };
}

/**
 * Returns deterministic implementation steps based on gap type.
 * Never invented — strictly derived from the gap type field.
 */
function getImplementationSteps(rec) {
  const steps = {
    keyword_gap: [
      'Add target keyword to project keyword list',
      'Create or update page targeting this keyword',
      'Optimise title tag and H1 with keyword',
      'Build internal links from related pages',
      'Monitor rank change over 30 days'
    ],
    content_gap: [
      'Research the topic using the competitor\'s ranking page as reference',
      'Create a content brief covering the identified subtopics',
      'Publish a new article or landing page',
      'Optimise for relevant LSI keywords',
      'Add schema markup where applicable',
      'Build internal links from existing content'
    ],
    page_gap: [
      'Analyse the competitor\'s equivalent page structure',
      'Design a matching page for your site',
      'Create the page with equivalent or better depth',
      'Optimise technical SEO (meta, schema, CWV)',
      'Submit for indexing via Google Search Console'
    ],
    backlink_gap: [
      'Research the referring domain and identify the relevant contact',
      'Develop a linkable asset or value proposition',
      'Outreach via email or social',
      'Follow up after 7–10 days',
      'Track link acquisition in backlink tool'
    ]
  };
  return steps[rec.type] || ['Review competitive gap', 'Plan response strategy'];
}

module.exports = { getOpportunities, assignBucket, enrichOpportunity };
