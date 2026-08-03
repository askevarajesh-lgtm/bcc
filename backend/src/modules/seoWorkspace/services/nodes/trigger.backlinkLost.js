module.exports = {
  id: 'trigger_backlink_lost',
  metadata: () => ({
    id: 'trigger_backlink_lost',
    name: 'Lost Backlink Detected',
    description: 'Triggers when a valuable backlink is lost or responds with 404/noindex',
    category: 'triggers',
    icon: 'unlink',
    inputs: [],
    outputs: ['sourceUrl', 'targetUrl', 'anchorText', 'domainAuthority', 'lostReason', 'detectedAt']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.minDomainAuthority && (eventPayload.domainAuthority || 0) < Number(config.minDomainAuthority)) {
      return false;
    }
    return true;
  }
};
