/**
 * Keyword Intelligence Service
 *
 * The shared orchestration layer every keyword feature (Discovery,
 * Clustering, Intent, SERP Analysis, Competitor Keywords, Trend Analysis,
 * Question/Related/Long-tail Keywords, Opportunities, AI Recommendations)
 * calls into. Per the approved architecture:
 *
 *   Keyword Intelligence → Keyword Provider → DataForSEO
 *                                            → Semrush
 *                                            → Future providers
 *
 * This file must NEVER `require('../../seoIntelligence/dataForSeo.service')`
 * or `require('../../semrush/semrush.service')` directly — only
 * `keywordProviderChain.js`. That's what keeps the platform
 * provider-independent: swapping/adding a vendor never touches this file.
 *
 * Every provider-chain call here is wrapped by `keywordCache.service.js`
 * (configurable TTL per operation) and, where it represents a meaningful
 * state change, emits a domain event via `keywordEvents.js` so other
 * modules (Blog AI, Website Builder, Reporting, Automation, Monitoring) can
 * react later without this file knowing about them.
 *
 * `collectKeywordCandidates`/etc. here intentionally mirror the function
 * candidates already used by `keywordResearchAgent.service.js` so that
 * agent can be refactored to call this layer with no behavior change, per
 * the implementation plan.
 */
const providerChain = require('../providers/keywordProviderChain');
const cache = require('./keywordCache.service');
const { keywordEvents, EVENTS } = require('../events/keywordEvents');
const logger = require('../../aiCore/logger.service');

const TAG = 'KeywordIntelligence';
const QUESTION_REGEX = /^(who|what|when|where|why|how|can|does|do|is|are|will|should)\b/i;

function dedupeByKeyword(candidates) {
  const merged = new Map();
  candidates.forEach((c) => {
    if (!c?.keyword) return;
    const key = c.keyword.toLowerCase();
    if (!merged.has(key)) merged.set(key, c);
  });
  return Array.from(merged.values());
}

/**
 * Suggestions + Ideas, merged and deduped — the candidate pool Discovery,
 * Related Keywords, Long-tail, and the regex-only Question Keywords filter
 * are all views over.
 *
 * @param {string} seed
 * @param {Object} [opts] - { locationCode, languageCode, limit, projectId, bypassCache }
 */
async function getCandidatePool(seed, opts = {}) {
  const params = { seed, locationCode: opts.locationCode, languageCode: opts.languageCode, limit: opts.limit };

  const [suggestions, ideas] = await Promise.all([
    cache.getOrFetch('keyword_suggestions', params, () => providerChain.getSuggestions(seed, opts),
      { projectId: opts.projectId, bypassCache: opts.bypassCache }),
    cache.getOrFetch('related_keywords', { ...params, kind: 'ideas' }, () => providerChain.getIdeas(seed, opts),
      { projectId: opts.projectId, bypassCache: opts.bypassCache })
  ]);

  return dedupeByKeyword([...(suggestions.data || []), ...(ideas.data || [])]);
}

/**
 * Enriches a candidate list with keyword difficulty (candidates from
 * getCandidatePool default difficulty to 0 since suggestions/ideas
 * endpoints don't return it).
 */
async function enrichWithDifficulty(candidates, opts = {}) {
  if (candidates.length === 0) return candidates;
  const keywords = candidates.map((c) => c.keyword);
  const { data } = await cache.getOrFetch('keyword_difficulty', { keywords, locationCode: opts.locationCode },
    () => providerChain.getDifficulty(keywords, opts), { projectId: opts.projectId, bypassCache: opts.bypassCache });

  const difficultyMap = new Map((data || []).map((d) => [(d.keyword || '').toLowerCase(), d.keywordDifficulty || 0]));
  return candidates.map((c) => ({ ...c, keywordDifficulty: difficultyMap.get(c.keyword.toLowerCase()) ?? c.keywordDifficulty ?? 0 }));
}

/**
 * Full discovery pass: candidate pool + difficulty enrichment. This is what
 * `keywordResearchAgent.collectKeywordCandidates` now delegates its
 * DataForSEO-facing work to.
 */
async function discoverKeywords(seed, opts = {}) {
  const pool = await getCandidatePool(seed, opts);
  const enriched = await enrichWithDifficulty(pool, opts);

  if (opts.projectId) {
    enriched.forEach((c) => {
      keywordEvents.emitSafe(EVENTS.KEYWORD_DISCOVERED, { projectId: opts.projectId, keyword: c.keyword, source: 'keywordIntelligence' });
    });
  }

  return enriched;
}

/**
 * Standalone, cheap volume+trend lookup for exact keywords — used by Trend
 * Analysis and by any "refresh metrics" action, without running the full
 * AI-curation pipeline.
 */
async function getSearchVolumeAndTrend(keywords, opts = {}) {
  const { data } = await cache.getOrFetch('search_volume', { keywords, locationCode: opts.locationCode },
    () => providerChain.getSearchVolume(keywords, opts), { projectId: opts.projectId, bypassCache: opts.bypassCache });

  if (opts.projectId) {
    keywordEvents.emitSafe(EVENTS.TREND_UPDATED, { projectId: opts.projectId, keywordCount: (data || []).length });
  }
  return data || [];
}

/**
 * SERP snapshot for one or more keywords — organic top 10, featured
 * snippet, PAA, related searches. Feeds Feature 4 (SERP Analysis) and, via
 * `paaQuestions`, the measured branch of Feature 10 (Question Keywords).
 */
async function getSerpSnapshot(tasks, opts = {}) {
  const { data } = await cache.getOrFetch('serp', { tasks }, () => providerChain.getSerpResults(tasks, opts),
    { projectId: opts.projectId, bypassCache: opts.bypassCache });

  if (opts.projectId) {
    (data || []).forEach((r) => {
      keywordEvents.emitSafe(EVENTS.SERP_UPDATED, { projectId: opts.projectId, keyword: r.keyword });
    });
  }
  return data || [];
}

/**
 * Ranked keywords for a competitor domain — feeds Feature 5 (Competitor
 * Keywords / gap detection). Gap/overlap classification itself stays in
 * `competitorAgent.service.js`, which owns the WorkspaceCompetitor model;
 * this just fetches the raw ranked list through the provider chain.
 */
async function getDomainRankedKeywords(domain, opts = {}) {
  const { data } = await cache.getOrFetch('search_volume', { domain, kind: 'ranked_keywords' },
    () => providerChain.getRankedKeywords(domain, opts), { projectId: opts.projectId, bypassCache: opts.bypassCache });
  return data || [];
}

/** Regex-based question classification — Feature 10's cheap, immediate branch. */
function filterQuestionKeywords(candidates) {
  return candidates.filter((c) => QUESTION_REGEX.test(c.keyword.trim()));
}

/** Word-count filter — Feature 12 (Long-tail). */
function filterLongTailKeywords(candidates, minWordCount = 4) {
  return candidates.filter((c) => c.keyword.trim().split(/\s+/).length >= minWordCount);
}

/**
 * Records a GapDetected event — called by whatever computes the actual gap
 * (Feature 5's competitor-keyword diff, Feature 13's content-gap agent) so
 * this file stays the single place those events are shaped consistently.
 */
function notifyGapDetected(payload) {
  keywordEvents.emitSafe(EVENTS.GAP_DETECTED, payload);
}

/** Records a ClusterCreated event — called by the future clustering agent (Feature 2). */
function notifyClusterCreated(payload) {
  keywordEvents.emitSafe(EVENTS.CLUSTER_CREATED, payload);
}

logger.debug(TAG, `Initialized. Configured providers: ${providerChain.PROVIDERS.filter((p) => p.isConfigured).map((p) => p.id).join(', ') || 'none'}`);

module.exports = {
  getCandidatePool,
  enrichWithDifficulty,
  discoverKeywords,
  getSearchVolumeAndTrend,
  getSerpSnapshot,
  getDomainRankedKeywords,
  filterQuestionKeywords,
  filterLongTailKeywords,
  notifyGapDetected,
  notifyClusterCreated,
  QUESTION_REGEX
};
