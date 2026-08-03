module.exports = {
  id: 'trigger_custom_event',
  metadata: () => ({
    id: 'trigger_custom_event',
    name: 'Custom Workspace Event',
    description: 'Triggers when any custom event name is emitted through WorkspaceEventBus',
    category: 'triggers',
    icon: 'sparkles',
    inputs: [],
    outputs: ['eventName', 'payload', 'timestamp', 'projectId']
  }),

  validate: (config) => Boolean(config && config.eventName),

  match: (config, eventPayload) => {
    if (!config || !config.eventName) return true;
    return config.eventName === eventPayload.eventName;
  }
};
