module.exports = {
  id: 'trigger_competitor_rank_change',
  metadata: () => ({
    id: 'trigger_competitor_rank_change',
    name: 'Competitor Rank Change',
    description: 'Triggers when a tracked competitor overtakes or surges on target keywords',
    category: 'triggers',
    icon: 'users',
    inputs: [],
    outputs: ['competitorDomain', 'keyword', 'competitorRank', 'ourRank', 'rankDifference']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.competitorDomain && eventPayload.competitorDomain && config.competitorDomain !== eventPayload.competitorDomain) {
      return false;
    }
    if (config.onlyWhenOvertakes && (eventPayload.competitorRank >= eventPayload.ourRank)) {
      return false;
    }
    return true;
  }
};
