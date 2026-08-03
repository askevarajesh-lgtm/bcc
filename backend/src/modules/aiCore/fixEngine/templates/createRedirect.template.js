/**
 * Fix Template — Create Redirect
 *
 * Generation template. Also 'high' risk in the registry's risk table — a
 * bad redirect target is a live-traffic-affecting mistake.
 */
function isPathLike(value) {
  return typeof value === 'string' && value.trim().length > 0 && !/\s/.test(value.trim());
}

module.exports = {
  taskType: 'Create Redirect',
  mode: 'generate',
  requiredFields: ['fromPath', 'toPath', 'statusCode'],
  validate(payload) {
    const errors = [];
    if (!payload || !isPathLike(payload.fromPath)) errors.push('fromPath must be a single path/URL with no whitespace');
    if (!payload || !isPathLike(payload.toPath)) errors.push('toPath must be a single path/URL with no whitespace');
    if (payload && payload.fromPath && payload.toPath && payload.fromPath === payload.toPath) {
      errors.push('fromPath and toPath must not be identical (redirect loop)');
    }
    if (!payload || ![301, 302, 307, 308].includes(payload.statusCode)) {
      errors.push('statusCode must be one of 301, 302, 307, 308');
    }
    return { valid: errors.length === 0, errors };
  },
  previewRenderer: 'RedirectDiff',
  aiPromptTemplate: 'Given the broken/redirect-chain issue "{issue}" affecting page "{pageUrl}" and recommendation '
    + '"{recommendation}", propose a redirect. Respond as JSON: '
    + '{ "fromPath": "...", "toPath": "...", "statusCode": 301 }'
};
