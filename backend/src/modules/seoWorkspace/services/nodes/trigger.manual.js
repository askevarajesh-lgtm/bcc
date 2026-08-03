module.exports = {
  id: 'trigger_manual',
  metadata: () => ({
    id: 'trigger_manual',
    name: 'Manual / On-Demand',
    description: 'Triggers workflow on manual execution from UI, API, or parent workflow',
    category: 'triggers',
    icon: 'play',
    inputs: [],
    outputs: ['triggeredBy', 'timestamp', 'customInputs']
  }),

  validate: () => true,

  match: () => true
};
