module.exports = {
  id: 'trigger_backlink_new',
  metadata: () => ({
    id: 'trigger_backlink_new',
    name: 'New Backlink Acquired',
    description: 'Triggers when a new backlink or referring domain is detected',
    category: 'triggers',
    icon: 'link-2',
    inputs: [],
    outputs: ['sourceUrl', 'targetUrl', 'anchorText', 'domainAuthority', 'isDoFollow', 'discoveredAt']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.minDomainAuthority && (eventPayload.domainAuthority || 0) < Number(config.minDomainAuthority)) {
      return false;
    }
    if (config.doFollowOnly && !eventPayload.isDoFollow) return false;
    return true;
  }
};
