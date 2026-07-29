/**
 * Fix Template — Internal Linking
 *
 * Pass-through template: `internalLinkingAgent.service.js` already produces
 * a hallucination-guarded `sourceUrl`/`targetUrl`/`anchorText` triple. No AI
 * call here.
 */
module.exports = {
  taskType: 'Internal Linking',
  mode: 'pass-through',
  requiredFields: ['sourceUrl', 'targetUrl', 'anchorText'],
  /**
   * @param {Object} finding - the internalLinkingAgent suggestion
   *   ({ sourceUrl, targetUrl, anchorText, reasonCategory, rationale })
   */
  extractPayload(finding = {}) {
    return {
      sourceUrl: finding.sourceUrl || null,
      targetUrl: finding.targetUrl || null,
      anchorText: finding.anchorText || null,
      reasonCategory: finding.reasonCategory || null
    };
  },
  validate(payload) {
    const errors = [];
    if (!payload || !payload.sourceUrl) errors.push('sourceUrl is required');
    if (!payload || !payload.targetUrl) errors.push('targetUrl is required');
    if (!payload || !payload.anchorText) errors.push('anchorText is required');
    if (payload && payload.sourceUrl && payload.targetUrl && payload.sourceUrl === payload.targetUrl) {
      errors.push('sourceUrl and targetUrl must not be identical (no self-links)');
    }
    return { valid: errors.length === 0, errors };
  },
  previewRenderer: 'InternalLinkDiff'
};
