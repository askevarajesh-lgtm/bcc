module.exports = {
  id: 'trigger_keyword_rank_improve',
  metadata: () => ({
    id: 'trigger_keyword_rank_improve',
    name: 'Keyword Rank Improvement',
    description: 'Triggers when a keyword rank climbs significantly or enters Top 3 / Top 10',
    category: 'triggers',
    icon: 'trending-up',
    inputs: [],
    outputs: ['keyword', 'keywordId', 'previousRank', 'currentRank', 'rankGain', 'targetUrl']
  }),

  validate: (config) => Boolean(config),

  match: (config, eventPayload) => {
    if (!config) return true;
    const gain = (eventPayload.previousRank || 0) - (eventPayload.currentRank || 0);
    if (config.minGainPositions && gain < Number(config.minGainPositions)) return false;
    if (config.mustEnterTop10 && (eventPayload.currentRank > 10 || eventPayload.currentRank <= 0)) return false;
    if (config.mustEnterTop3 && (eventPayload.currentRank > 3 || eventPayload.currentRank <= 0)) return false;
    return true;
  }
};
