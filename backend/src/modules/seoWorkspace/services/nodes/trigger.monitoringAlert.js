module.exports = {
  id: 'trigger_monitoring_alert',
  metadata: () => ({
    id: 'trigger_monitoring_alert',
    name: 'Monitoring Alert Fired',
    description: 'Triggers when a monitoring plugin generates an alert (Critical, High, Medium, Low)',
    category: 'triggers',
    icon: 'bell',
    inputs: [],
    outputs: ['alertId', 'severity', 'category', 'entityType', 'entityId', 'aiSummary', 'recommendation']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.severity && eventPayload.severity && config.severity !== eventPayload.severity) return false;
    if (config.category && eventPayload.category && config.category !== eventPayload.category) return false;
    return true;
  }
};
