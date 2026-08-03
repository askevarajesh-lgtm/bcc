module.exports = {
  id: 'trigger_rss_feed',
  metadata: () => ({
    id: 'trigger_rss_feed',
    name: 'RSS / Feed Item',
    description: 'Triggers when a new article or item is published to an RSS or Atom feed',
    category: 'triggers',
    icon: 'rss',
    inputs: [],
    outputs: ['itemTitle', 'itemLink', 'itemPubDate', 'itemContent', 'feedUrl']
  }),

  validate: (config) => Boolean(config && config.feedUrl),

  match: (config, eventPayload) => {
    if (!config) return true;
    if (config.feedUrl && eventPayload.feedUrl && config.feedUrl !== eventPayload.feedUrl) return false;
    return true;
  }
};
