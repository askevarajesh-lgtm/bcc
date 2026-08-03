module.exports = {
  id: 'action_end',
  
  metadata: () => ({
    id: 'action_end',
    name: 'End / Return Output',
    description: 'Terminates workflow execution cleanly and sets final workflow output variables',
    category: 'logic',
    icon: 'square',
    inputs: ['outputVariables', 'finalStatus'],
    outputs: ['finalOutputs', 'endedAt']
  }),

  validate: () => true,

  execute: async (config, context) => {
    return {
      success: true,
      isEndNode: true,
      finalOutputs: config.outputVariables || context.variables || {},
      endedAt: new Date()
    };
  }
};
