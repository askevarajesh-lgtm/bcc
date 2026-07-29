/**
 * Fix Template — Content Edit
 *
 * Generation template. Higher risk than metadata changes (it touches live
 * page copy), so `risk` is fixed at 'high' in the Fix Template Registry's
 * risk lookup table (see templates/index.js), independent of AI confidence.
 */
module.exports = {
  taskType: 'Content Edit',
  mode: 'generate',
  requiredFields: ['revisedContent'],
  validate(payload) {
    const errors = [];
    if (!payload || typeof payload.revisedContent !== 'string' || !payload.revisedContent.trim()) {
      errors.push('revisedContent must be a non-empty string');
    }
    if (payload && payload.revisedContent && payload.revisedContent.length > 20000) {
      errors.push('revisedContent exceeds the 20,000 character safety limit');
    }
    return { valid: errors.length === 0, errors };
  },
  previewRenderer: 'ContentDiff',
  aiPromptTemplate: 'Given this page\'s issue "{issue}" and recommendation "{recommendation}", '
    + 'produce a revised passage of on-page content that resolves the issue while preserving the page\'s '
    + 'existing voice and intent. Respond as JSON: { "revisedContent": "..." }'
};
