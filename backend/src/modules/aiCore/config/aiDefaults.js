/**
 * AI Core — Default Provider/Model Configuration
 *
 * Single source of truth for the platform-wide default AI provider and
 * default model string. Nothing else in the codebase should hardcode
 * these values — every place that needs a "no explicit choice made yet"
 * fallback (schema defaults, aiEngine's default parameter, aiStudio
 * settings fallback responses, etc.) imports from here instead.
 *
 * Scope note: this governs the *default* only. It does not change or
 * replace per-agent model configuration (agentLoader.service.js,
 * ContentAgentRegistryService.js), per-call model overrides, or any
 * provider-specific logic (e.g. image generation, which is unaffected).
 * Both "openai" and "anthropic" remain fully supported provider values;
 * this module only defines which one/which model is used when nothing
 * else has been specified.
 */

const DEFAULT_AI_PROVIDER = 'anthropic';
const DEFAULT_AI_MODEL = 'claude-sonnet-5';

module.exports = {
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_MODEL,
};
