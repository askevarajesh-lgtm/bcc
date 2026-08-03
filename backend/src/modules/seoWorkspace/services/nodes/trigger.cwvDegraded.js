module.exports = {
  id: 'trigger_cwv_degraded',
  metadata: () => ({
    id: 'trigger_cwv_degraded',
    name: 'Core Web Vitals Degraded',
    description: 'Triggers when LCP, INP, CLS, or FCP exceeds acceptable performance thresholds',
    category: 'triggers',
    icon: 'gauge',
    inputs: [],
    outputs: ['url', 'metricName', 'previousValue', 'currentValue', 'status', 'device']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.metric && eventPayload.metricName && config.metric !== eventPayload.metricName) return false;
    if (config.device && eventPayload.device && config.device !== eventPayload.device) return false;
    return true;
  }
};
