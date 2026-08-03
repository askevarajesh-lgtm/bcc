const crypto = require('crypto');

module.exports = {
  id: 'trigger_webhook',
  metadata: () => ({
    id: 'trigger_webhook',
    name: 'Inbound Webhook',
    description: 'Triggers workflow on HTTP POST to webhook endpoint with optional HMAC signature verification',
    category: 'triggers',
    icon: 'zap',
    inputs: [],
    outputs: ['headers', 'body', 'query', 'timestamp']
  }),

  validate: (config) => {
    return true; // Webhook configs can have optional secret verification
  },

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.secret && eventPayload.signature) {
      const computed = crypto.createHmac('sha256', config.secret).update(JSON.stringify(eventPayload.body || {})).digest('hex');
      return computed === eventPayload.signature;
    }
    return true;
  }
};
