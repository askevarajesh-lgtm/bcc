/**
 * Fix Template — Generic Manual (fallback)
 *
 * Used when `fixEngine.generateFix()` is called with a `taskType` that has
 * no registered template yet (e.g. 'Target New Keyword', 'Close Content
 * Gap', 'Build Backlink', 'Close Page Gap', or a future module's taskType
 * before its template is added to templates/index.js). Degrades to today's
 * manual-only behavior — never a hard error.
 */
module.exports = {
  taskType: null, // matched only as the explicit fallback, not looked up by name
  mode: 'manual',
  requiredFields: [],
  validate() {
    return { valid: true, errors: [] };
  },
  previewRenderer: 'ManualReviewOnly'
};
