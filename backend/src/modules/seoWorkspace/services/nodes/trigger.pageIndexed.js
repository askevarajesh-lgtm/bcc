module.exports = {
  id: 'trigger_page_indexed',
  metadata: () => ({
    id: 'trigger_page_indexed',
    name: 'New Page Indexed',
    description: 'Triggers when a new or updated URL is confirmed indexed by Google Indexing API / GSC',
    category: 'triggers',
    icon: 'check-circle',
    inputs: [],
    outputs: ['url', 'indexedAt', 'sitemapUrl', 'coverageStatus']
  }),

  validate: () => true,

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.urlPattern && eventPayload.url && !eventPayload.url.includes(config.urlPattern)) {
      return false;
    }
    return true;
  }
};
