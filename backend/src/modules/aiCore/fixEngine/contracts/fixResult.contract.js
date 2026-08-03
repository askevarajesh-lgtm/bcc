/**
 * AI Core — Fix Engine — Fix Result Contract
 *
 * Mirrors `aiCore/contracts/analyzerResult.contract.js` exactly: one
 * standardized shape every call to `fixEngine.generateFix()` returns, and a
 * wrapper (`withFixContract`) that times the work and — critically — catches
 * any error the generation logic throws and converts it into a well-formed,
 * degraded FixResult (`autoFixable: false`, `confidence: 0`, an `errors`
 * entry describing the failure) instead of throwing. Same "never take down
 * the caller" contract analyzers already use, per Architecture Refinements
 * v2 §1.
 *
 * Shape (per Architecture Refinements v2 §4):
 *   { payload, autoFixable, confidence, risk, affectedPages,
 *     verificationStatus, errors }
 */
const { nowIso, durationMs } = require('../../utils/timing.util');

const VALID_RISKS = new Set(['low', 'medium', 'high']);
const VALID_VERIFICATION_STATUSES = new Set([
  'Not Verified', 'Pending Verification', 'Verified', 'Failed', 'Inconclusive'
]);

function clampConfidence(confidence) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return 0;
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Fills in defaults and normalizes a partial result into the full contract
 * shape. Safe to call directly for callers building their own result.
 *
 * @param {Object} partial
 * @returns {Object} FixResult
 */
function createFixResult(partial = {}) {
  const {
    payload = {},
    autoFixable = false,
    confidence = 0,
    risk = 'medium',
    affectedPages = [],
    verificationStatus = 'Not Verified',
    errors = [],
    _meta = null
  } = partial;

  return {
    payload: payload && typeof payload === 'object' ? payload : {},
    autoFixable: Boolean(autoFixable),
    confidence: clampConfidence(confidence),
    risk: VALID_RISKS.has(risk) ? risk : 'medium',
    affectedPages: Array.isArray(affectedPages) ? affectedPages : [],
    verificationStatus: VALID_VERIFICATION_STATUSES.has(verificationStatus) ? verificationStatus : 'Not Verified',
    errors: Array.isArray(errors) ? errors : [],
    // Telemetry only, not part of the contract shape callers rely on — safe to ignore.
    _meta
  };
}

/**
 * @param {string} taskType - the taskType the fix was generated for, used only for error messaging
 * @param {() => Promise<Object>} fn - core fix-generation logic; must resolve with
 *   a partial FixResult (minus verificationStatus, which this wrapper always
 *   initializes to 'Not Verified' — a fix is never pre-verified at generation time)
 * @returns {Promise<Object>} FixResult
 */
async function withFixContract(taskType, fn) {
  const startedAt = nowIso();
  try {
    const partial = await fn();
    const finishedAt = nowIso();
    return createFixResult({
      ...partial,
      verificationStatus: 'Not Verified',
      _meta: { taskType, startedAt, finishedAt, duration: durationMs(startedAt, finishedAt) }
    });
  } catch (error) {
    const finishedAt = nowIso();
    return createFixResult({
      payload: {},
      autoFixable: false,
      confidence: 0,
      risk: 'high',
      affectedPages: [],
      verificationStatus: 'Not Verified',
      errors: [`Fix generation failed for "${taskType}": ${error.message}`],
      _meta: { taskType, startedAt, finishedAt, duration: durationMs(startedAt, finishedAt), failed: true }
    });
  }
}

module.exports = { createFixResult, withFixContract, clampConfidence };
