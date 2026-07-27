/**
 * AI Core — AI Engine
 *
 * The single place that resolves an AI client and makes a completion call.
 * Reuses, unchanged:
 *   - `aiStudio/models/aiSettings.model.js` (AiSettings) for per-tenant keys
 *   - `utils/crypto.js` for decrypting stored keys
 *   - `utils/aiClientWrapper.js` for the actual OpenAI/Anthropic call shape
 *
 * `workspaceAgentOrchestrator.service.js` currently has its own private
 * `_getAiClient(workspaceId)` implementing this exact same lookup. This is
 * not duplicated here a second time — this is the one place it should live;
 * wiring the orchestrator to call this instead of its own copy is a
 * follow-up (next phase, per instructions) so this pass doesn't touch or
 * risk breaking the orchestrator's existing behavior.
 *
 * Adds three things the orchestrator's version doesn't have: retries
 * (Retry System), execution tracking (Execution Status), and structured
 * telemetry (Logger) — all optional/additive, none of them change what a
 * call returns.
 */
const AiSettings = require('../../aiStudio/models/aiSettings.model');
const cryptoUtils = require('../../../utils/crypto');
const AiClientWrapper = require('../../../utils/aiClientWrapper');
const retry = require('./retry.service');
const executionStatus = require('./executionStatus.service');
const logger = require('./logger.service');

/**
 * Resolves an AiClientWrapper for a given workspace/tenant. Same resolution
 * order as the orchestrator's existing `_getAiClient`: Anthropic key first
 * if present, otherwise falls back to OpenAI if one is configured.
 */
async function getClient(workspaceId) {
  if (!workspaceId) throw new Error('AI Engine: workspaceId is required to resolve an AI client.');

  const settings = await AiSettings.findOne({ workspaceId });
  if (settings) {
    if (settings.anthropicApiKey) {
      return new AiClientWrapper(cryptoUtils.decrypt(settings.anthropicApiKey), 'anthropic');
    }
    if (settings.openaiApiKey) {
      return new AiClientWrapper(cryptoUtils.decrypt(settings.openaiApiKey), 'openai');
    }
  }

  throw new Error('AI Engine: no AI provider API key configured for this workspace. Please configure one in settings.');
}

/**
 * @param {Object} params
 * @param {string} params.workspaceId - required, tenant scope for key lookup
 * @param {Array}  params.messages - chat-style messages, per AiClientWrapper's contract
 * @param {string} [params.model='gpt-4o-mini']
 * @param {number} [params.temperature=0.7]
 * @param {number} [params.maxTokens]
 * @param {boolean} [params.jsonMode=false] - requests a JSON object response
 * @param {string} [params.agentKey] - optional, for telemetry only (data reference, not new logic)
 * @param {string} [params.projectId] - optional, for telemetry only
 * @param {Object} [params.retryOptions] - passed through to Retry System
 * @returns {Promise<string>} the model's text content
 */
async function complete(params) {
  const {
    workspaceId, messages, model = 'gpt-4o-mini', temperature = 0.7,
    maxTokens, jsonMode = false, agentKey, projectId, retryOptions = {}
  } = params;

  const executionId = `aiEngine:${agentKey || 'unspecified'}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();
  executionStatus.start(executionId, { agentKey, projectId, model });
  logger.logExecution({ executionId, source: 'aiEngine', agentKey, projectId, status: 'started', meta: { model } });

  try {
    const result = await retry.withRetry(async (attempt) => {
      if (attempt > 0) {
        logger.logExecution({ executionId, source: 'aiEngine', agentKey, projectId, status: 'retrying', meta: { attempt } });
      }
      const client = await getClient(workspaceId);
      const requestParams = {
        model,
        messages,
        temperature
      };
      if (maxTokens) requestParams.max_tokens = maxTokens;
      if (jsonMode) requestParams.response_format = { type: 'json_object' };

      const response = await client.chat.completions.create(requestParams);
      return response.choices[0].message.content;
    }, retryOptions);

    const durationMs = Date.now() - startedAt;
    executionStatus.succeed(executionId, { length: result ? result.length : 0 });
    logger.logExecution({ executionId, source: 'aiEngine', agentKey, projectId, status: 'succeeded', durationMs });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    executionStatus.fail(executionId, error);
    logger.logExecution({ executionId, source: 'aiEngine', agentKey, projectId, status: 'failed', durationMs, error: error.message });
    throw error;
  }
}

module.exports = { getClient, complete };
