module.exports = {
  id: 'trigger_webhook',
  
  metadata: () => ({
    id: 'trigger_webhook',
    name: 'Webhook Trigger',
    description: 'Triggers workflow on incoming HTTP webhook',
    category: 'integration',
    icon: 'zap'
  }),

  validate: (config) => {
    // Webhook configuration might define expected payload schema or secret token
    return true;
  },

  evaluate: (eventData, config) => {
    if (eventData.source === 'webhook') {
      // Evaluate if the webhook path or token matches this specific trigger's config
      if (config.webhookPath && eventData.path !== config.webhookPath) {
        return false;
      }
      return true;
    }
    return false;
  }
};
