module.exports = {
  id: 'action_transform',
  
  metadata: () => ({
    id: 'action_transform',
    name: 'Transform & Format Data',
    description: 'Performs string formatting, regex extraction, array filtering, math calculations, and object mapping',
    category: 'logic',
    icon: 'sliders',
    inputs: ['operation', 'input', 'pattern', 'template', 'replacement'],
    outputs: ['output', 'isMatch', 'matchedGroups']
  }),

  validate: (config) => Boolean(config && config.operation),

  execute: async (config, context) => {
    const { operation, input, pattern, template, replacement } = config;
    let output = input;
    let isMatch = false;
    let matchedGroups = [];

    switch (operation) {
      case 'template_string': {
        // String template interpolation
        output = String(template || '').replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          const trimmed = key.trim();
          return context.variables?.[trimmed] !== undefined ? context.variables[trimmed] : match;
        });
        break;
      }
      case 'regex_match': {
        const re = new RegExp(pattern || '.*');
        const match = String(input || '').match(re);
        isMatch = Boolean(match);
        matchedGroups = match ? Array.from(match) : [];
        output = match ? match[0] : null;
        break;
      }
      case 'regex_replace': {
        const re = new RegExp(pattern || '', 'g');
        output = String(input || '').replace(re, replacement || '');
        break;
      }
      case 'to_uppercase': {
        output = String(input || '').toUpperCase();
        break;
      }
      case 'to_lowercase': {
        output = String(input || '').toLowerCase();
        break;
      }
      case 'array_length': {
        output = Array.isArray(input) ? input.length : 0;
        break;
      }
      case 'array_join': {
        output = Array.isArray(input) ? input.join(replacement || ', ') : String(input);
        break;
      }
      case 'math_round': {
        output = Math.round(Number(input) || 0);
        break;
      }
      default:
        output = input;
    }

    return {
      success: true,
      output,
      isMatch,
      matchedGroups
    };
  }
};
