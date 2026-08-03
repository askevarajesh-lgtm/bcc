module.exports = {
  id: 'trigger_gsc_performance',
  metadata: () => ({
    id: 'trigger_gsc_performance',
    name: 'Google Search Console Anomaly',
    description: 'Triggers when GSC clicks, impressions, CTR, or avg position changes beyond threshold',
    category: 'triggers',
    icon: 'search',
    inputs: [],
    outputs: ['metric', 'changePercent', 'previousValue', 'currentValue', 'query', 'page', 'dateRange']
  }),

  validate: (config) => {
    return Boolean(config && (config.metric || config.thresholdPercent));
  },

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.metric && eventPayload.metric && config.metric !== eventPayload.metric) return false;
    if (config.thresholdPercent && Math.abs(eventPayload.changePercent || 0) < Number(config.thresholdPercent)) {
      return false;
    }
    return true;
  }
};
