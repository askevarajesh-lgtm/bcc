module.exports = {
  id: 'trigger_uptime_down',
  metadata: () => ({
    id: 'trigger_uptime_down',
    name: 'Site Downtime Detected',
    description: 'Triggers when a monitored endpoint is unreachable or returns 5xx HTTP error',
    category: 'triggers',
    icon: 'power-off',
    inputs: [],
    outputs: ['url', 'statusCode', 'responseTimeMs', 'errorMessage', 'downtimeDurationMinutes']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.minStatusCode && (eventPayload.statusCode || 0) < Number(config.minStatusCode)) {
      return false;
    }
    return true;
  }
};
