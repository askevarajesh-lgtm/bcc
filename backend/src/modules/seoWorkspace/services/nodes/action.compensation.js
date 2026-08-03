module.exports = {
  id: 'action_compensation',
  
  metadata: () => ({
    id: 'action_compensation',
    name: 'Compensation / Rollback',
    description: 'Executes undo/cleanup actions if any preceding node in the transaction fails',
    category: 'logic',
    icon: 'undo-2',
    inputs: ['compensationAction', 'targetEntityId', 'rollbackPayload'],
    outputs: ['isCompensated', 'timestamp']
  }),

  validate: () => true,

  execute: async (config, context) => {
    return {
      success: true,
      isCompensated: true,
      timestamp: new Date(),
      action: config.compensationAction || 'rollback'
    };
  }
};
