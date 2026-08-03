module.exports = {
  id: 'action_loop',
  
  metadata: () => ({
    id: 'action_loop',
    name: 'For Each Loop / Batch',
    description: 'Iterates over an array of items (e.g. keywords, URLs) and processes downstream nodes per item',
    category: 'logic',
    icon: 'repeat',
    inputs: ['items', 'maxIterations', 'concurrency', 'batchSize'],
    outputs: ['currentItem', 'currentIndex', 'totalItems', 'isLast']
  }),

  validate: (config) => Boolean(config),

  execute: async (config, context) => {
    const rawItems = Array.isArray(config.items) ? config.items : (context.variables?.items || []);
    const maxIterations = Math.min(Number(config.maxIterations) || 100, 500);
    const items = rawItems.slice(0, maxIterations);

    return {
      success: true,
      itemsCount: items.length,
      isLoopStart: true,
      items
    };
  }
};
