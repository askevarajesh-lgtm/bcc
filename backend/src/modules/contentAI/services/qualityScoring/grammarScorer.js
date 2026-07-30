/**
 * ContentAI Quality Scoring — Grammar axis.
 *
 * AI-assisted via `aiCore/aiEngine.service.js`, JSON mode — reuses the
 * exact same client-resolution/retry/logging path every generator call
 * already goes through, rather than a second AI-calling mechanism.
 */
const aiEngine = require('../../../aiCore/aiEngine.service');
const { proseText } = require('./_textExtract');

const MAX_CHARS = 6000; // keep the grammar-check call cheap; content beyond this is sampled, not scored blind

async function score(payload = {}, context = {}) {
  const text = proseText(payload).slice(0, MAX_CHARS);
  if (!text || text.split(/\s+/).filter(Boolean).length < 5) {
    return { score: null, issues: [] };
  }

  try {
    const raw = await aiEngine.complete({
      workspaceId: context.workspaceId,
      model: context.model || 'gpt-4o-mini',
      jsonMode: true,
      agentKey: 'content-quality-grammar-scorer',
      projectId: context.contentPieceId,
      messages: [
        {
          role: 'system',
          content: 'You are a strict proofreader. Identify real grammar, spelling, and punctuation '
            + 'errors only — not stylistic preferences. Respond with ONLY JSON: '
            + '{ "score": 0-100, "issues": [ { "text": "the problematic snippet", "suggestion": "the fix" } ] }'
        },
        { role: 'user', content: text }
      ]
    });
    const parsed = JSON.parse(raw);
    const clamped = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    return { score: clamped, issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 20) : [] };
  } catch (error) {
    // Scoring must never block content generation/persistence — degrade to unscored.
    return { score: null, issues: [], error: error.message };
  }
}

module.exports = { score };
