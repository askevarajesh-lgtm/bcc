/**
 * Fix Template — Update Meta Tags
 *
 * Generation template: fixEngine calls aiEngine.complete() with
 * `aiPromptTemplate` (placeholders filled from finding/context), parses the
 * JSON response, then runs `validate()` against it before it's ever shown to
 * a human or eligible for auto-fix.
 */
module.exports = {
  taskType: 'Update Meta Tags',
  mode: 'generate',
  requiredFields: ['title', 'metaDescription'],
  validate(payload) {
    const errors = [];
    if (!payload || !payload.title || payload.title.length > 60) errors.push('title must be 1-60 chars');
    if (!payload || !payload.metaDescription || payload.metaDescription.length > 160) errors.push('metaDescription must be 1-160 chars');
    return { valid: errors.length === 0, errors };
  },
  previewRenderer: 'MetaTagsDiff',
  aiPromptTemplate: 'Given this page\'s current title "{currentTitle}" and issue "{issue}", '
    + 'produce an improved title (<=60 chars) and meta description (<=160 chars). '
    + 'Respond as JSON: { "title": "...", "metaDescription": "..." }'
};
