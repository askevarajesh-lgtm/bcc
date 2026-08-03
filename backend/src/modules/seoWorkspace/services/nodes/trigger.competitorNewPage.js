module.exports = {
  id: 'trigger_competitor_new_page',
  metadata: () => ({
    id: 'trigger_competitor_new_page',
    name: 'Competitor New Page Published',
    description: 'Triggers when a competitor publishes a new URL, blog post, or product page',
    category: 'triggers',
    icon: 'file-plus',
    inputs: [],
    outputs: ['competitorDomain', 'pageUrl', 'title', 'estimatedWordCount', 'targetTopics', 'detectedAt']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.competitorDomain && eventPayload.competitorDomain && config.competitorDomain !== eventPayload.competitorDomain) {
      return false;
    }
    return true;
  }
};
