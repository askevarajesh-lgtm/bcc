/**
 * AI Studio — Default Provider/Model Configuration (frontend)
 *
 * Mirrors backend/src/modules/aiCore/config/aiDefaults.js. Frontend and
 * backend run as separate bundles, so this can't be a literal shared
 * import, but this file is the single frontend-side place these values
 * are defined. AIStudio.jsx (and nothing else) should read its default
 * provider/model display state from here rather than hardcoding strings.
 *
 * If these values ever change, update both this file and the backend
 * counterpart together.
 */

export const DEFAULT_AI_PROVIDER = 'anthropic';
export const DEFAULT_AI_MODEL = 'claude-sonnet-5';

export const AI_PROVIDER_LABELS = {
  anthropic: 'Claude (Anthropic)',
  openai: 'OpenAI',
};
