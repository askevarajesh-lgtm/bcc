const logger = require('../../aiCore/logger.service');

const TAG = 'AutomationExpressionEngine';

/**
 * Universal Expression Engine for Automation workflows.
 * Safely evaluates simple expressions and string interpolation against a context object.
 * 
 * Supports:
 * - Direct variable access: "project.name"
 * - Expressions: "rank < 10", "audit.score >= 90"
 * - String interpolation: "Hello {{project.name}}"
 */

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function evaluateExpression(expression, context, interpolateString = false) {
  if (typeof expression !== 'string') return expression;

  // Built-in globals
  const sandbox = {
    ...context,
    today: new Date(),
    date: new Date().toISOString()
  };

  try {
    if (interpolateString) {
      // Replace {{ var }} with evaluated value
      return expression.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
        const result = safeEval(p1.trim(), sandbox);
        return result !== undefined && result !== null ? result : '';
      });
    } else {
      // Evaluate raw expression
      let cleanExpr = expression;
      if (cleanExpr.startsWith('{{') && cleanExpr.endsWith('}}')) {
        cleanExpr = cleanExpr.slice(2, -2).trim();
      }
      return safeEval(cleanExpr, sandbox);
    }
  } catch (error) {
    logger.warn(TAG, `Expression evaluation failed: ${expression}`, { error: error.message });
    return null;
  }
}

/**
 * A safe, restricted evaluator for basic operators.
 * Do not use eval() or Function() for security.
 * Instead, use a basic parser or regex matching for our allowed expressions.
 */
function safeEval(expr, context) {
  // Simple path resolution e.g., 'project.name'
  if (/^[a-zA-Z0-9_.]+$/.test(expr)) {
    return resolvePath(context, expr);
  }

  // Basic comparison e.g., 'rank < 10'
  const comparisonMatch = expr.match(/^([a-zA-Z0-9_.]+)\s*(==|===|!=|!==|>|>=|<|<=)\s*(.*)$/);
  if (comparisonMatch) {
    const [, leftPath, op, rightStr] = comparisonMatch;
    const leftVal = resolvePath(context, leftPath);
    let rightVal = rightStr;
    
    // Parse right side
    if (rightStr === 'true') rightVal = true;
    else if (rightStr === 'false') rightVal = false;
    else if (rightStr === 'null') rightVal = null;
    else if (!isNaN(Number(rightStr))) rightVal = Number(rightStr);
    else if (rightStr.startsWith('"') && rightStr.endsWith('"')) rightVal = rightStr.slice(1, -1);
    else if (rightStr.startsWith("'") && rightStr.endsWith("'")) rightVal = rightStr.slice(1, -1);
    else rightVal = resolvePath(context, rightStr);

    switch (op) {
      case '==': return leftVal == rightVal;
      case '===': return leftVal === rightVal;
      case '!=': return leftVal != rightVal;
      case '!==': return leftVal !== rightVal;
      case '>': return leftVal > rightVal;
      case '>=': return leftVal >= rightVal;
      case '<': return leftVal < rightVal;
      case '<=': return leftVal <= rightVal;
    }
  }

  // String 'contains' e.g., 'keyword contains "seo"'
  const containsMatch = expr.match(/^([a-zA-Z0-9_.]+)\s+contains\s+(.*)$/);
  if (containsMatch) {
    const [, leftPath, rightStr] = containsMatch;
    const leftVal = resolvePath(context, leftPath);
    let rightVal = rightStr;
    if (rightStr.startsWith('"') && rightStr.endsWith('"')) rightVal = rightStr.slice(1, -1);
    else if (rightStr.startsWith("'") && rightStr.endsWith("'")) rightVal = rightStr.slice(1, -1);
    
    if (typeof leftVal === 'string') {
      return leftVal.includes(rightVal);
    }
    return false;
  }

  // Fallback string interpolation check (e.g. math operations) 
  // In a full enterprise scenario, we'd use a safe parser like `jsep` or `expr-eval`.
  // For now, this strict regex-based evaluation covers the requirements securely.
  
  return null;
}

module.exports = {
  evaluateExpression
};
