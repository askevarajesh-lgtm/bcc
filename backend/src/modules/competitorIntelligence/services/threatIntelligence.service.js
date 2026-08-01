/**
 * Threat Intelligence Service — Enterprise Competitor Intelligence
 *
 * Computes a structured threat score for each competitor in a project.
 * Uses a deterministic multi-factor formula first (never fabricates numbers),
 * then optionally annotates with AI reasoning — same pattern as
 * `competitorRecommendation.service.js`.
 *
 * Score Factors (weighted, 0–100 each):
 *   - Traffic Ratio       (30%) — their traffic / your traffic (capped)
 *   - Keyword Growth      (20%) — growth in their keyword count vs last snapshot
 *   - Authority Gap       (20%) — their domain authority vs yours
 *   - Backlink Growth     (15%) — growth in their referring domains vs last snapshot
 *   - Content Growth      (10%) — growth in indexed pages vs last snapshot
 *   - AI Visibility       (5%)  — their aiScore (GEO presence)
 *
 * Threat Level Thresholds:
 *   score >= 65 → 'high'
 *   score >= 35 → 'medium'
 *   score  < 35 → 'low'
 */
const WorkspaceCompetitor = require('../../seoWorkspace/models/workspaceCompetitor.model');
const CompetitorSnapshot  = require('../models/competitorSnapshot.model');
const aiEngine   = require('../../aiCore/aiEngine.service');
const agentLoader = require('../../aiCore/agentLoader.service');
const logger     = require('../../aiCore/logger.service');

const AGENT_KEY = 'competitor-intelligence-agent';
const TAG = 'ThreatIntelligence';

// Factor weights — must sum to 1.0
const WEIGHTS = {
  trafficRatio:   0.30,
  keywordGrowth:  0.20,
  authorityGap:   0.20,
  backlinkGrowth: 0.15,
  contentGrowth:  0.10,
  aiVisibility:   0.05
};

/**
 * Normalises a raw ratio to a 0–100 score. `ratio` = competitor / yours.
 * ratio > 1 = they beat you = higher threat. Capped at 100.
 */
function ratioToScore(ratio) {
  if (!ratio || ratio <= 0) return 0;
  // 1.0 = parity (score 50), 2.0 = twice as strong (score ~80), 0.5 = half (score 25)
  const score = 50 * Math.min(ratio, 4) / 2;
  return Math.min(100, Math.round(score));
}

/** Growth percentage → 0–100 score. Negative growth = 0. */
function growthToScore(growthPct) {
  if (!growthPct || growthPct <= 0) return 0;
  // +100% growth → score 100, +10% growth → score ~33
  return Math.min(100, Math.round(Math.log1p(growthPct / 10) * 40));
}

/**
 * @param {Object} competitor - WorkspaceCompetitor lean doc
 * @param {Object} yourMetrics - { organicTraffic, organicKeywords, metrics.authority, metrics.referringDomains }
 * @param {Object|null} prevSnapshot - CompetitorSnapshot one period ago (or null if no history)
 * @returns {{ rawScore: number, factors: Object }}
 */
function computeDeterministicScore(competitor, yourMetrics, prevSnapshot) {
  const m = competitor.metrics || {};
  const prev = prevSnapshot?.metrics || {};

  // Traffic ratio factor
  const trafficRatio = yourMetrics.organicTraffic > 0
    ? (m.organicTraffic || 0) / yourMetrics.organicTraffic
    : (m.organicTraffic > 0 ? 2 : 0);
  const trafficScore = ratioToScore(trafficRatio);

  // Keyword growth factor
  const kwPrev = prev.organicKeywords || m.organicKeywords || 0;
  const kwGrowthPct = kwPrev > 0 ? ((m.organicKeywords - kwPrev) / kwPrev) * 100 : 0;
  const keywordGrowthScore = growthToScore(kwGrowthPct);

  // Authority gap factor
  const authorityGap = (m.authority || m.domainRank || 0) - (yourMetrics.authority || 0);
  const authorityScore = Math.max(0, Math.min(100, 50 + authorityGap)); // 50 = parity

  // Backlink growth factor
  const blPrev = prev.referringDomains || m.referringDomains || 0;
  const blGrowthPct = blPrev > 0 ? ((m.referringDomains - blPrev) / blPrev) * 100 : 0;
  const backlinkGrowthScore = growthToScore(blGrowthPct);

  // Content growth factor
  const pgPrev = prev.indexedPages || m.indexedPages || 0;
  const pgGrowthPct = pgPrev > 0 ? ((m.indexedPages - pgPrev) / pgPrev) * 100 : 0;
  const contentGrowthScore = growthToScore(pgGrowthPct);

  // AI visibility factor (already 0–100 on the model)
  const aiVisibilityScore = Math.min(100, competitor.aiScore || 0);

  const rawScore = Math.round(
    trafficScore       * WEIGHTS.trafficRatio   +
    keywordGrowthScore * WEIGHTS.keywordGrowth  +
    authorityScore     * WEIGHTS.authorityGap   +
    backlinkGrowthScore* WEIGHTS.backlinkGrowth +
    contentGrowthScore * WEIGHTS.contentGrowth  +
    aiVisibilityScore  * WEIGHTS.aiVisibility
  );

  return {
    rawScore: Math.min(100, Math.max(0, rawScore)),
    factors: {
      trafficScore,
      keywordGrowthScore,
      authorityScore,
      backlinkGrowthScore,
      contentGrowthScore,
      aiVisibilityScore
    }
  };
}

function scoreToLevel(score) {
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function deterministicReason(competitor, factors) {
  const top = Object.entries(factors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k]) => k.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim());
  return `Primary threat drivers: ${top.join(' and ')} relative to your domain.`;
}

/**
 * Compute and persist threat scores for all non-rejected competitors in a project.
 *
 * @param {string|ObjectId} projectId
 * @param {Object} yourMetrics - { organicTraffic, organicKeywords, authority }
 * @param {Object} [opts]
 * @param {boolean} [opts.useAi=true] - whether to annotate with AI reasoning
 * @param {string|ObjectId} [opts.workspaceId]
 * @returns {Promise<Array<{ domain, threatScore, threatLevel, reason, prediction }>>}
 */
async function computeAndSave(projectId, yourMetrics, opts = {}) {
  const { useAi = true, workspaceId } = opts;

  const competitors = await WorkspaceCompetitor.find({
    projectId, isDeleted: false, status: { $ne: 'Rejected' }
  }).lean();

  if (competitors.length === 0) return [];

  // Fetch most recent snapshot for each competitor (for growth calculations)
  const domains = competitors.map((c) => c.domain);
  const latestSnapshots = await CompetitorSnapshot.aggregate([
    { $match: { projectId: competitors[0].projectId, domain: { $in: domains } } },
    { $sort:  { capturedAt: -1 } },
    { $group: { _id: '$domain', doc: { $first: '$$ROOT' } } }
  ]);
  const snapshotByDomain = Object.fromEntries(latestSnapshots.map((s) => [s._id, s.doc]));

  // Deterministic scoring for all competitors
  const scored = competitors.map((c) => {
    const { rawScore, factors } = computeDeterministicScore(c, yourMetrics, snapshotByDomain[c.domain]);
    return {
      _id: c._id,
      domain: c.domain,
      threatScore: rawScore,
      threatLevel: scoreToLevel(rawScore),
      reason: deterministicReason(c, factors),
      prediction: null,
      factors,
      rationaleSource: 'deterministic'
    };
  });

  // AI annotation (best-effort, non-blocking)
  if (useAi && workspaceId) {
    try {
      const aiResults = await annotateWithAi(scored, projectId, workspaceId);
      aiResults.forEach((ai, idx) => {
        if (ai?.reason)      scored[idx].reason      = ai.reason;
        if (ai?.prediction)  scored[idx].prediction  = ai.prediction;
        scored[idx].rationaleSource = 'ai';
      });
    } catch (err) {
      logger.warn(TAG, `AI annotation failed, using deterministic only: ${err.message}`, { projectId });
    }
  }

  // Persist updated scores to WorkspaceCompetitor
  const bulkOps = scored.map((s) => ({
    updateOne: {
      filter: { _id: s._id },
      update: { $set: {
        threatScore: s.threatScore,
        'agent.threatLevel': s.threatLevel,
        lastCrawl: new Date()
      }}
    }
  }));
  await WorkspaceCompetitor.bulkWrite(bulkOps);

  return scored;
}

async function annotateWithAi(scored, projectId, workspaceId) {
  const agentConfig = await agentLoader.resolve(AGENT_KEY);

  const prompt = `You are the Competitor Intelligence Threat Analyst.

For each of the following ${scored.length} competitors, provide:
1. A 1-sentence threat reason grounded in their threat score (${scored.map((s) => s.threatScore).join(', ')})
2. A 1-sentence prediction of their competitive trajectory over the next 90 days

Data:
${JSON.stringify(scored.map((s) => ({ domain: s.domain, threatScore: s.threatScore, threatLevel: s.threatLevel, factors: s.factors })), null, 2)}

Respond ONLY with a JSON array, same length and order as input:
[{ "reason": "...", "prediction": "..." }]
No markdown, no commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 1200,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length !== scored.length) {
    throw new Error('AI threat annotation response shape mismatch');
  }
  return parsed;
}

module.exports = { computeAndSave, computeDeterministicScore, scoreToLevel };
