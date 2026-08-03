const mongoose = require('mongoose');

module.exports = {
  id: 'action_database_query',
  
  metadata: () => ({
    id: 'action_database_query',
    name: 'Database Query (SEO Workspace)',
    description: 'Queries workspace collections such as Keywords, Audits, Snapshots, Competitors, and Tasks',
    category: 'actions',
    icon: 'database',
    inputs: ['collectionName', 'filter', 'sort', 'limit', 'projection'],
    outputs: ['results', 'count', 'firstResult']
  }),

  validate: (config) => Boolean(config && config.collectionName),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        results: [{ _id: 'sim_1', name: 'Sample record', projectId: context.projectId }],
        count: 1,
        firstResult: { _id: 'sim_1', name: 'Sample record' }
      };
    }

    const ALLOWED_COLLECTIONS = {
      keywords: 'WorkspaceKeyword',
      audits: 'WorkspaceAudit',
      tasks: 'WorkspaceTask',
      competitors: 'WorkspaceCompetitor',
      alerts: 'WorkspaceMonitoringAlert',
      snapshots: 'WorkspaceMonitoringSnapshot',
      reports: 'WorkspaceReport'
    };

    const modelName = ALLOWED_COLLECTIONS[config.collectionName.toLowerCase()];
    if (!modelName || !mongoose.models[modelName]) {
      throw new Error(`Collection '${config.collectionName}' is not allowed or does not exist`);
    }

    const Model = mongoose.models[modelName];
    const filter = { projectId: context.projectId, ...(config.filter || {}) };
    const limit = Math.min(Number(config.limit) || 20, 200);
    const sort = config.sort || { createdAt: -1 };

    const docs = await Model.find(filter)
      .select(config.projection || '')
      .sort(sort)
      .limit(limit)
      .lean();

    return {
      success: true,
      results: docs,
      count: docs.length,
      firstResult: docs[0] || null
    };
  }
};
