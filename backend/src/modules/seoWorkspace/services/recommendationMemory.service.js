/**
 * Recommendation Memory Service
 *
 * Records the full lifecycle of AI keyword recommendations
 * (recommended → accepted/rejected/ignored → ranking outcome) and turns
 * that history into a compact prompt-context block, the same pattern
 * `sharedMemory.recallAsPromptContext()` already uses for coarse lessons —
 * this is the quantitative counterpart.
 */
const RecommendationMemory = require('../models/recommendationMemory.model');
const logger = require('../../aiCore/logger.service');

const TAG = 'RecommendationMemory';

/**
 * Called once per AI-suggested keyword when a research/recommendation run
 * completes (status starts as 'recommended').
 */
async function recordRecommendation({ projectId, agencyId, keyword, keywordId, agentKey, theme, opportunityScore, rationale }) {
  try {
    return await RecommendationMemory.create({
      projectId, agencyId, keyword, keywordId, agentKey, theme, opportunityScore, rationale, status: 'recommended'
    });
  } catch (error) {
    logger.warn(TAG, `Failed to record recommendation for "${keyword}": ${error.message}`, { projectId });
    return null;
  }
}

async function recordManyRecommendations(entries) {
  return Promise.all(entries.map(recordRecommendation));
}

/**
 * Marks the most recent still-open ('recommended') memory rows for these
 * keywords as accepted/rejected. Called from the existing approve/reject
 * flows in keywordResearchAgent.service.js.
 */
async function markResponded(projectId, keywords, status, userId, reason = null) {
  if (!Array.isArray(keywords) || keywords.length === 0) return { modifiedCount: 0 };
  try {
    const result = await RecommendationMemory.updateMany(
      { projectId, keyword: { $in: keywords }, status: 'recommended' },
      { $set: { status, respondedAt: new Date(), respondedBy: userId || null, rejectionReason: reason } }
    );
    return result;
  } catch (error) {
    logger.warn(TAG, `Failed to mark ${status} for ${keywords.length} keyword(s): ${error.message}`, { projectId });
    return { modifiedCount: 0 };
  }
}

/**
 * Sweeps recommendations left in 'recommended' status past a staleness
 * window into 'ignored' — a recommendation nobody acted on is itself a
 * signal (the AI misjudged relevance/priority), distinct from an explicit reject.
 */
async function markStaleAsIgnored(projectId, olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  try {
    return await RecommendationMemory.updateMany(
      { projectId, status: 'recommended', createdAt: { $lt: cutoff } },
      { $set: { status: 'ignored', respondedAt: new Date() } }
    );
  } catch (error) {
    logger.warn(TAG, `Failed to sweep stale recommendations: ${error.message}`, { projectId });
    return { modifiedCount: 0 };
  }
}

/**
 * Records a ranking-based outcome for an accepted recommendation — called
 * from wherever rank-checking already happens (workspaceCron.service.js)
 * once a keyword that came from a recommendation gets a new `currentRank`.
 */
async function recordOutcome(projectId, keyword, { rankBefore, rankAfter }) {
  try {
    const entry = await RecommendationMemory.findOne({ projectId, keyword, status: 'accepted' }).sort({ respondedAt: -1 });
    if (!entry) return null;

    const rankImprovement = (Number.isFinite(rankBefore) && Number.isFinite(rankAfter)) ? rankBefore - rankAfter : null;
    entry.outcome = {
      tracked: true,
      rankBefore: rankBefore ?? null,
      rankAfter: rankAfter ?? null,
      rankImprovement,
      measuredAt: new Date(),
      successful: rankImprovement != null ? rankImprovement > 0 : null
    };
    await entry.save();
    return entry;
  } catch (error) {
    logger.warn(TAG, `Failed to record outcome for "${keyword}": ${error.message}`, { projectId });
    return null;
  }
}

/**
 * Aggregates history into counts + per-theme acceptance rate, for both
 * programmatic use (e.g. an "Opportunities" scoring boost) and prompt text.
 */
async function getSummary(projectId) {
  const rows = await RecommendationMemory.find({ projectId }).lean();

  const counts = { recommended: 0, accepted: 0, rejected: 0, ignored: 0, successful: 0 };
  const byTheme = new Map();

  for (const r of rows) {
    counts[r.status] = (counts[r.status] || 0) + 1;
    if (r.outcome?.successful) counts.successful += 1;

    if (r.theme) {
      const t = byTheme.get(r.theme) || { theme: r.theme, accepted: 0, rejected: 0, total: 0 };
      t.total += 1;
      if (r.status === 'accepted') t.accepted += 1;
      if (r.status === 'rejected') t.rejected += 1;
      byTheme.set(r.theme, t);
    }
  }

  return { counts, themes: Array.from(byTheme.values()).sort((a, b) => b.total - a.total) };
}

/**
 * Flattens getSummary() into the same plain-text-block shape
 * sharedMemory.recallAsPromptContext() produces, so a caller can
 * concatenate both into one AI prompt consistently.
 */
async function recallAsPromptContext(projectId) {
  const { counts, themes } = await getSummary(projectId);
  if (counts.recommended + counts.accepted + counts.rejected + counts.ignored === 0) return '';

  let block = '\n--- RECOMMENDATION HISTORY (past AI keyword suggestions for this project) ---\n';
  block += `Accepted: ${counts.accepted}, Rejected: ${counts.rejected}, Ignored: ${counts.ignored}, Confirmed successful (ranking improved): ${counts.successful}\n`;

  const notable = themes.filter((t) => t.total >= 2).slice(0, 5);
  if (notable.length) {
    block += 'By theme:\n';
    notable.forEach((t) => {
      block += `  - "${t.theme}": ${t.accepted}/${t.total} accepted\n`;
    });
  }
  return block;
}

module.exports = {
  recordRecommendation,
  recordManyRecommendations,
  markResponded,
  markStaleAsIgnored,
  recordOutcome,
  getSummary,
  recallAsPromptContext
};
