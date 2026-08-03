/**
 * AI Core — Fix Engine — Fix Template Registry
 *
 * Registry map: taskType -> template. Adding a check for a future module
 * (Blog SEO / Store SEO / Website Builder SEO / GEO / AEO) is one new
 * template file + one line here — `fixEngine.service.js` itself never
 * changes (Architecture Refinements v2 §2).
 */
const updateMetaTags = require('./updateMetaTags.template');
const contentEdit = require('./contentEdit.template');
const createRedirect = require('./createRedirect.template');
const schemaInjection = require('./schemaInjection.template');
const imageOptimization = require('./imageOptimization.template');
const internalLinking = require('./internalLinking.template');
const genericManual = require('./genericManual.template');

const REGISTRY = {
  [updateMetaTags.taskType]: updateMetaTags,
  [contentEdit.taskType]: contentEdit,
  [createRedirect.taskType]: createRedirect,
  [schemaInjection.taskType]: schemaInjection,
  [imageOptimization.taskType]: imageOptimization,
  [internalLinking.taskType]: internalLinking
};

/**
 * `risk` is deliberately not AI-generated — an LLM rating its own change's
 * risk is a weak signal to gate safety on. Static lookup keyed by taskType,
 * visible and auditable rather than emergent (§4). Additive/non-destructive
 * changes are 'low', live-content changes are 'medium'/'high'.
 */
const RISK_BY_TASK_TYPE = {
  'Update Meta Tags': 'low',
  'Schema Injection': 'low',
  'Image Optimization': 'low',
  'Internal Linking': 'medium',
  'Content Edit': 'high',
  'Create Redirect': 'high'
};
const DEFAULT_RISK = 'medium';

/**
 * @param {string} taskType
 * @returns {Object} the matching template, or the generic manual fallback
 */
function getTemplate(taskType) {
  return REGISTRY[taskType] || genericManual;
}

/**
 * @param {string} taskType
 * @returns {'low'|'medium'|'high'}
 */
function getRisk(taskType) {
  return RISK_BY_TASK_TYPE[taskType] || DEFAULT_RISK;
}

function listRegisteredTaskTypes() {
  return Object.keys(REGISTRY);
}

module.exports = { getTemplate, getRisk, listRegisteredTaskTypes, genericManual };
