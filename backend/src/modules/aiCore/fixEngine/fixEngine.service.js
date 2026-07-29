/**
 * AI Core — Fix Engine
 *
 * Single entry point: generateFix({ taskType, finding, context }).
 * Relocated/generalized out of the originally-proposed `seoWorkspace`
 * location per Architecture Refinements v2 §1. Mirrors the module's
 * existing `analyzers/` + `contracts/` convention rather than inventing a
 * second pattern next to it.
 *
 * Consumption model — the engine does not own domain knowledge, callers
 * supply it. It never imports `WorkspaceProject`, `WorkspaceTechnicalAudit`,
 * or any module-specific model, which is what makes it reusable by Blog
 * SEO/Store SEO/Website Builder SEO/GEO/AEO without those modules' models
 * becoming a dependency of `aiCore`.
 *
 * Scope stays exactly what the prior doc's §3.1 defined: this only
 * *generates and validates* the payload. It does not publish anything —
 * `WordPressService.publishTaskUpdate()` remains the only thing that talks
 * to WordPress, called only from Apply.
 */
const aiEngine = require('../aiEngine.service');
const logger = require('../logger.service');
const templates = require('./templates');
const { withFixContract } = require('./contracts/fixResult.contract');

const TAG = 'FixEngine';

/**
 * Fills `{placeholder}` tokens in a template string from `finding` and
 * `context`, in that lookup order. Unresolved placeholders are left as an
 * empty string rather than throwing — a missing signal isn't a hard failure,
 * `validate()` further down the pipeline is what actually gates safety.
 */
function fillPlaceholders(templateString, finding = {}, context = {}) {
  return templateString.replace(/\{(\w+)\}/g, (match, key) => {
    if (finding && finding[key] !== undefined && finding[key] !== null) return String(finding[key]);
    if (context && context[key] !== undefined && context[key] !== null) return String(context[key]);
    return '';
  });
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    logger.warn(TAG, `Failed to parse AI fix-generation JSON: ${error.message}`);
    return {};
  }
}

/**
 * @param {Object} finding - the existing finding/recommendation object, untouched
 * @returns {string[]}
 */
function deriveAffectedPages(finding = {}) {
  if (Array.isArray(finding.affectedPages) && finding.affectedPages.length) return finding.affectedPages;
  if (finding.pageUrl) return [finding.pageUrl];
  if (finding.sourceUrl) return [finding.sourceUrl]; // internal linking: the page the new link is added to
  return [];
}

/**
 * @param {Object} params
 * @param {string} params.taskType - e.g. 'Update Meta Tags'
 * @param {Object} params.finding - the existing finding object, untouched
 * @param {Object} [params.context] - caller-supplied; engine never reaches into WorkspaceProject itself
 * @param {string} [params.context.workspaceId] - required only for generation-mode templates (AI call)
 * @returns {Promise<Object>} FixResult, per contracts/fixResult.contract.js
 */
async function generateFix({ taskType, finding, context = {} }) {
  return withFixContract(taskType, async () => {
    const template = templates.getTemplate(taskType);
    const risk = templates.getRisk(taskType);
    const affectedPages = deriveAffectedPages(finding);

    let payload;
    let confidence;

    if (template.mode === 'pass-through') {
      // The fix already exists on the source agent's own output — no AI call.
      payload = template.extractPayload(finding, context);
      confidence = 100;
    } else if (template.mode === 'generate') {
      if (!context.workspaceId) {
        throw new Error(`Fix Engine: context.workspaceId is required to generate a fix for taskType "${taskType}"`);
      }
      const prompt = fillPlaceholders(template.aiPromptTemplate, finding, context);
      const raw = await aiEngine.complete({
        workspaceId: context.workspaceId,
        agentKey: 'fix-engine',
        projectId: context.projectId,
        messages: [{ role: 'user', content: prompt }],
        model: context.modelName || 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 800,
        jsonMode: true,
        retryOptions: { retries: 2 }
      });
      const parsed = safeParseJson(raw);
      payload = parsed;
      confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 70;
    } else {
      // 'manual' mode (genericManual fallback) — no template yet for this taskType.
      payload = {};
      confidence = 0;
    }

    const validation = template.validate(payload);

    return {
      payload,
      // This is the mechanism that replaces "arbitrary AI payloads" with schema-constrained
      // ones: nothing reaches Approve/Apply without passing its template's own validator first.
      autoFixable: validation.valid,
      confidence: validation.valid ? confidence : 0,
      risk,
      affectedPages,
      errors: validation.valid ? [] : validation.errors
    };
  });
}

module.exports = { generateFix };
