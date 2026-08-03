module.exports = {
  id: 'trigger_page_deindexed',
  metadata: () => ({
    id: 'trigger_page_deindexed',
    name: 'Page Deindexed',
    description: 'Triggers when a previously indexed high-value URL drops from Google or Bing index',
    category: 'triggers',
    icon: 'alert-triangle',
    inputs: [],
    outputs: ['url', 'statusCode', 'noindexDetected', 'canonicalUrl', 'lastIndexedDate']
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
