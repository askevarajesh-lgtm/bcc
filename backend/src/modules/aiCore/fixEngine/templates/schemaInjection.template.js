/**
 * Fix Template — Schema Injection
 *
 * Pass-through template: `schemaAgent.service.js` already produces a
 * validated `jsonLd` object per page (via its own `validateSchemaMarkup()`,
 * reused here as the finding's `validation`). No AI call — the fix is the
 * source agent's own already-approved-shape output, so `confidence` is
 * fixed at 100 by `fixEngine.service.js` for all pass-through templates.
 */
module.exports = {
  taskType: 'Schema Injection',
  mode: 'pass-through',
  requiredFields: ['jsonLd'],
  /**
   * @param {Object} finding - the schemaAgent generated-page object
   *   ({ pageUrl, pageType, schemaTypes, jsonLd, validation, rationale })
   */
  extractPayload(finding = {}) {
    return {
      pageUrl: finding.pageUrl || null,
      pageType: finding.pageType || null,
      schemaTypes: Array.isArray(finding.schemaTypes) ? finding.schemaTypes : [],
      jsonLd: finding.jsonLd || null
    };
  },
  validate(payload) {
    const errors = [];
    if (!payload || !payload.jsonLd || typeof payload.jsonLd !== 'object') {
      errors.push('jsonLd is required and must be an object');
    }
    return { valid: errors.length === 0, errors };
  },
  previewRenderer: 'SchemaDiff'
};
