const expressionService = require('../automationExpression.service');

module.exports = {
  id: 'action_condition',
  
  metadata: () => ({
    id: 'action_condition',
    name: 'If / Else Condition',
    description: 'Evaluates logical rules or expressions and branches execution to True or False ports',
    category: 'logic',
    icon: 'git-branch',
    inputs: ['expression', 'rules', 'matchAll'],
    outputs: ['result', 'branch', 'evaluatedExpression']
  }),

  validate: (config) => Boolean(config && (config.expression || Array.isArray(config.rules))),

  execute: async (config, context) => {
    let result = false;

    if (config.expression) {
      result = expressionService.evaluate(config.expression, context.variables || {});
    } else if (Array.isArray(config.rules) && config.rules.length > 0) {
      const results = config.rules.map(rule => {
        const left = context.variables?.[rule.field] !== undefined ? context.variables[rule.field] : rule.field;
        const right = rule.value;
        switch (rule.operator) {
          case 'equals':
          case '==': return String(left) === String(right);
          case 'not_equals':
          case '!=': return String(left) !== String(right);
          case 'greater_than':
          case '>': return Number(left) > Number(right);
          case 'less_than':
          case '<': return Number(left) < Number(right);
          case 'greater_than_or_equal':
          case '>=': return Number(left) >= Number(right);
          case 'less_than_or_equal':
          case '<=': return Number(left) <= Number(right);
          case 'contains': return String(left || '').includes(String(right || ''));
          case 'starts_with': return String(left || '').startsWith(String(right || ''));
          case 'is_empty': return !left || (Array.isArray(left) && left.length === 0);
          case 'is_not_empty': return Boolean(left && (!Array.isArray(left) || left.length > 0));
          default: return false;
        }
      });

      result = config.matchAll !== false ? results.every(Boolean) : results.some(Boolean);
    }

    const branch = result ? 'true' : 'false';

    return {
      success: true,
      result,
      branch,
      evaluatedExpression: config.expression || 'rule_set'
    };
  }
};
