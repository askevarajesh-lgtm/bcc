module.exports = {
  id: 'trigger_ga4_traffic',
  metadata: () => ({
    id: 'trigger_ga4_traffic',
    name: 'GA4 Traffic Anomaly',
    description: 'Triggers when Google Analytics 4 organic sessions, bounce rate, or conversions spike or drop',
    category: 'triggers',
    icon: 'bar-chart',
    inputs: [],
    outputs: ['sessions', 'users', 'conversions', 'changePercent', 'landingPage', 'sourceMedium']
  }),

  validate: (config) => {
    return Boolean(config && (config.metric || config.thresholdPercent));
  },

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.thresholdPercent && Math.abs(eventPayload.changePercent || 0) < Number(config.thresholdPercent)) {
      return false;
    }
    return true;
  }
};
