/**
 * ContentAI Quality Scoring — AI Confidence axis.
 *
 * The underlying `AiClientWrapper`/chat-completions call this platform uses
 * doesn't expose token-level logprobs, so this is a self-reported confidence
 * pass: one additional `aiEngine.complete` call (same client/retry/logging
 * path as every other generator call) asking the model to rate its own
 * output against the original inputs and brand-voice constraints.
 */
const aiEngine = require('../../../aiCore/aiEngine.service');

async function score(payload = {}, context = {}) {
  try {
    const raw = await aiEngine.complete({
      workspaceId: context.workspaceId,
      model: context.model || 'gpt-4o-mini',
      jsonMode: true,
      temperature: 0,
      agentKey: 'content-quality-ai-confidence-scorer',
      projectId: context.contentPieceId,
      messages: [
        {
          role: 'system',
          content: 'You are grading your own prior output for how confident you are that it correctly and '
            + 'fully satisfies the brief, with no fabricated facts. Respond with ONLY JSON: '
            + '{ "confidence": 0-100, "reasoning": "one sentence" }'
        },
        {
          role: 'user',
          content: `Original brief:\n${context.originalPrompt || '(not provided)'}\n\nGenerated output:\n${JSON.stringify(payload).slice(0, 4000)}`
        }
      ]
    });
    const parsed = JSON.parse(raw);
    const clamped = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0)));
    return { score: clamped, method: 'model_signal' };
  } catch (error) {
    return { score: null, method: 'unavailable', error: error.message };
  }
}

module.exports = { score };
