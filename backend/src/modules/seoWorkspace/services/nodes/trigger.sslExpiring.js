module.exports = {
  id: 'trigger_ssl_expiring',
  metadata: () => ({
    id: 'trigger_ssl_expiring',
    name: 'SSL Certificate Expiring',
    description: 'Triggers when an SSL certificate is within X days of expiration',
    category: 'triggers',
    icon: 'shield-alert',
    inputs: [],
    outputs: ['domain', 'daysRemaining', 'issuer', 'validTo', 'isExpired']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    const maxDays = Number(config.daysRemainingThreshold) || 14;
    if ((eventPayload.daysRemaining || 0) > maxDays) return false;
    return true;
  }
};
