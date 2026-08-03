module.exports = {
  id: 'trigger_keyword_rank_drop',
  metadata: () => ({
    id: 'trigger_keyword_rank_drop',
    name: 'Keyword Rank Drop',
    description: 'Triggers when a tracked keyword drops in SERP ranking by a configured number of positions',
    category: 'triggers',
    icon: 'trending-down',
    inputs: [],
    outputs: ['keyword', 'keywordId', 'previousRank', 'currentRank', 'rankDelta', 'targetUrl', 'serpFeatures']
  }),

  validate: (config) => {
    return Boolean(config && (config.minDropPositions !== undefined || config.alertSeverity));
  },

  match: (config, eventPayload) => {
    if (!config) return true;
    const minDrop = Number(config.minDropPositions) || 1;
    const actualDrop = (eventPayload.currentRank || 0) - (eventPayload.previousRank || 0);
    if (actualDrop < minDrop) return false;
    if (config.tags && config.tags.length > 0) {
      const keywordTags = eventPayload.tags || [];
      const hasTag = config.tags.some(t => keywordTags.includes(t));
      if (!hasTag) return false;
    }
    return true;
  }
};
