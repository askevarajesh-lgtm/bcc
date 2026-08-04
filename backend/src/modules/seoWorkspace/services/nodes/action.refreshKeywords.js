const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceKeyword = require('../../models/workspaceKeyword.model');
const rankTrackingService = require('../rankTracking.service');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRefreshKeywords';

module.exports = {
  id: 'refresh_keywords',
  name: 'Refresh Keyword Rankings',
  category: 'Keywords & Rankings',
  icon: 'TrendingUp',
  description: 'Triggers live SERP rank tracking across Google/Bing for project tracked keywords, calculates visibility index and detects rank shifts.',

  documentation: {
    overview: 'Runs batch rank tracking for active project keywords, updating historical position snapshots and computing visibility delta.',
    inputsDoc: [
      { name: 'keywordFilter', desc: 'Filter keywords by tag, status, or intent', type: 'string', default: 'all' },
      { name: 'maxKeywords', desc: 'Maximum number of keywords to track in this run', type: 'number', default: 50 },
      { name: 'searchEngine', desc: 'Target search engine provider (Google, Bing)', type: 'string', default: 'Google' }
    ],
    outputsDoc: [
      { name: 'totalKeywordsTracked', desc: 'Number of keywords checked', type: 'number' },
      { name: 'visibilityIndex', desc: 'Project organic visibility score (0-100)', type: 'number' },
      { name: 'averagePosition', desc: 'Average SERP rank across tracked keywords', type: 'number' },
      { name: 'top10Count', desc: 'Keywords ranking in the top 10 SERP', type: 'number' },
      { name: 'top3Count', desc: 'Keywords ranking in the top 3 SERP', type: 'number' },
      { name: 'rankDropsCount', desc: 'Number of keywords experiencing rank drops', type: 'number' },
      { name: 'rankImprovementsCount', desc: 'Number of keywords gaining rank', type: 'number' },
      { name: 'keywords', desc: 'Full keyword list with position, search volume, difficulty, CPC, intent', type: 'array' },
      { name: 'rankDrops', desc: 'Keywords that lost position with drop amount', type: 'array' },
      { name: 'rankImprovements', desc: 'Keywords that gained position with gain amount', type: 'array' }
    ],
    bestPractices: 'Schedule keyword refreshes daily to capture volatility before planning content briefs.'
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true,
    supportsRollback: false
  },

  estimatedRuntimeMs: 30000,
  estimatedCost: { apiCalls: 1, aiTokens: 100, thirdPartyCalls: 5 },
  dependencies: [],
  permissions: ['seo:keywords:track'],

  getInputSchema() {
    return [
      { name: 'keywordFilter', label: 'Keyword Filter', type: 'select', defaultValue: 'all', options: [
        { label: 'All Tracked Keywords', value: 'all' },
        { label: 'Core / High Priority Keywords', value: 'priority' },
        { label: 'Keywords with Recent Rank Drops', value: 'drops' }
      ]},
      { name: 'maxKeywords', label: 'Max Keywords to Track', type: 'number', defaultValue: 50, min: 1, max: 500 },
      { name: 'searchEngine', label: 'Search Engine', type: 'select', defaultValue: 'Google', options: [
        { label: 'Google Desktop & Mobile', value: 'Google' },
        { label: 'Bing SERP', value: 'Bing' }
      ]}
    ];
  },

  getOutputSchema() {
    return {
      totalKeywordsTracked: { type: 'number', description: 'Total keywords checked' },
      visibilityIndex: { type: 'number', description: 'Computed visibility score (0-100)' },
      averagePosition: { type: 'number', description: 'Average SERP position' },
      top10Count: { type: 'number', description: 'Count of keywords in top 10' },
      top3Count: { type: 'number', description: 'Count of keywords in top 3' },
      rankDropsCount: { type: 'number', description: 'Keywords that dropped position' },
      rankImprovementsCount: { type: 'number', description: 'Keywords that gained position' },
      keywords: { type: 'array', description: 'Full keyword list with metrics and ranking' },
      rankDrops: { type: 'array', description: 'Keywords with rank drops' },
      rankImprovements: { type: 'array', description: 'Keywords with rank improvements' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Keyword Rank Refresh for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const limit = Number(config.maxKeywords) || 50;

    // Snapshot ranks BEFORE tracking to compute deltas
    let beforeMap = {};
    const keywordsBefore = await WorkspaceKeyword.find({ projectId }).limit(limit).lean();
    keywordsBefore.forEach(k => {
      beforeMap[k._id.toString()] = k.ranking?.currentRank ?? null;
    });

    if (keywordsBefore.length > 0 && project) {
      try {
        await rankTrackingService.trackKeywords(project, await WorkspaceKeyword.find({ projectId }).limit(limit));
      } catch (err) {
        logger.warn(TAG, `Rank tracking service error: ${err.message}`);
      }
    }

    // Re-query after tracking to get updated ranks
    const updatedKeywords = await WorkspaceKeyword.find({ projectId }).limit(limit).lean();

    // Compute comprehensive metrics
    const rankedKeywords = updatedKeywords.filter(k => k.ranking?.currentRank > 0 && k.ranking?.currentRank < 100);
    const top10 = rankedKeywords.filter(k => k.ranking?.currentRank <= 10).length;
    const top3 = rankedKeywords.filter(k => k.ranking?.currentRank <= 3).length;
    const avgPos = rankedKeywords.length > 0
      ? Math.round(rankedKeywords.reduce((acc, k) => acc + (k.ranking?.currentRank || 0), 0) / rankedKeywords.length)
      : 0;

    // Visibility: weighted by position and search volume
    let totalVisibilityWeight = 0;
    let totalSearchVolume = 0;
    rankedKeywords.forEach(k => {
      const rank = k.ranking?.currentRank || 100;
      const vol = k.metrics?.searchVolume || 0;
      const ctrEstimate = rank <= 1 ? 0.28 : rank <= 3 ? 0.15 : rank <= 10 ? 0.05 : 0.01;
      totalVisibilityWeight += vol * ctrEstimate;
      totalSearchVolume += vol;
    });
    const visibilityIndex = totalSearchVolume > 0
      ? Math.min(100, Math.round((totalVisibilityWeight / totalSearchVolume) * 100 * 3.5))
      : (top10 > 0 ? Math.min(100, Math.round((top10 / updatedKeywords.length) * 100)) : 0);

    // Detect drops and improvements using before snapshot
    const rankDrops = [];
    const rankImprovements = [];
    updatedKeywords.forEach(k => {
      const prevRank = beforeMap[k._id.toString()];
      const currRank = k.ranking?.currentRank ?? null;
      if (prevRank !== null && currRank !== null) {
        const delta = currRank - prevRank;
        if (delta > 0) {
          rankDrops.push({
            keyword: k.keyword,
            previousRank: prevRank,
            currentRank: currRank,
            dropAmount: delta,
            searchVolume: k.metrics?.searchVolume || 0,
            intent: k.metrics?.intent || 'unknown'
          });
        } else if (delta < 0) {
          rankImprovements.push({
            keyword: k.keyword,
            previousRank: prevRank,
            currentRank: currRank,
            gainAmount: Math.abs(delta),
            searchVolume: k.metrics?.searchVolume || 0,
            intent: k.metrics?.intent || 'unknown'
          });
        }
      }
    });

    // Build full keyword list
    const keywordList = updatedKeywords.map(k => ({
      keywordId: k._id.toString(),
      keyword: k.keyword,
      status: k.status,
      currentRank: k.ranking?.currentRank ?? null,
      previousRank: k.ranking?.previousRank ?? null,
      bestRank: k.ranking?.bestRank ?? null,
      rankingUrl: k.ranking?.url || null,
      searchVolume: k.metrics?.searchVolume || 0,
      keywordDifficulty: k.metrics?.keywordDifficulty || 0,
      cpc: k.metrics?.cpc || 0,
      intent: k.metrics?.intent || 'unknown',
      competition: k.metrics?.competition || 0,
      tags: k.tags || [],
      lastUpdated: k.ranking?.lastTracked ? new Date(k.ranking.lastTracked).toISOString() : null
    }));

    return {
      success: true,
      totalKeywordsTracked: updatedKeywords.length,
      visibilityIndex,
      averagePosition: avgPos,
      top10Count: top10,
      top3Count: top3,
      rankedCount: rankedKeywords.length,
      rankDropsCount: rankDrops.length,
      rankImprovementsCount: rankImprovements.length,
      keywords: keywordList,
      rankDrops,
      rankImprovements
    };
  }
};
