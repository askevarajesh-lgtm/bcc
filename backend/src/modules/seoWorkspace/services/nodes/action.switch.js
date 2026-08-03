module.exports = {
  id: 'action_switch',
  
  metadata: () => ({
    id: 'action_switch',
    name: 'Switch (Multi-Case)',
    description: 'Routes execution to one of multiple named output ports based on matched value',
    category: 'logic',
    icon: 'shuffle',
    inputs: ['value', 'cases', 'defaultCase'],
    outputs: ['matchedCase', 'branch']
  }),

  validate: (config) => Boolean(config && Array.isArray(config.cases)),

  execute: async (config, context) => {
    const val = String(config.value !== undefined ? config.value : (context.variables?.switchValue || ''));
    let matchedCase = config.defaultCase || 'default';

    for (const c of (config.cases || [])) {
      if (String(c.matchValue) === val) {
        matchedCase = c.caseName || c.matchValue;
        break;
      }
    }

    return {
      success: true,
      matchedCase,
      branch: matchedCase
    };
  }
};
