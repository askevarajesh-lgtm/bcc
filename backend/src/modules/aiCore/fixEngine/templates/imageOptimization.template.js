/**
 * Fix Template — Image Optimization
 *
 * Pass-through template: `imageSeoAgent.service.js` already produces a
 * validated `proposedValue` per image recommendation (via its own
 * `validateRecommendation()`). No AI call here.
 */
module.exports = {
  taskType: 'Image Optimization',
  mode: 'pass-through',
  requiredFields: ['proposedValue'],
  /**
   * @param {Object} finding - the imageSeoAgent generated recommendation
   *   ({ pageUrl, src, recommendationType, currentValue, proposedValue, rationale, isValid })
   */
  extractPayload(finding = {}) {
    return {
      pageUrl: finding.pageUrl || null,
      src: finding.src || null,
      recommendationType: finding.recommendationType || null,
      currentValue: finding.currentValue || '',
      proposedValue: finding.proposedValue || ''
    };
  },
  validate(payload) {
    const errors = [];
    if (!payload || !payload.proposedValue) errors.push('proposedValue is required');
    if (!payload || !payload.src) errors.push('src is required');
    return { valid: errors.length === 0, errors };
  },
  previewRenderer: 'ImageOptimizationDiff'
};
