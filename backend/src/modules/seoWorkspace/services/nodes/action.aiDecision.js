const logger = require('../../../aiCore/logger.service');
const aiEngine = require('../../../aiCore/aiEngine.service');

module.exports = {
  id: 'action_ai_decision',
  
  metadata: () => ({
    id: 'action_ai_decision',
    name: 'AI Decision Node',
    description: 'Evaluates context data using LLM reasoning and outputs a branch decision with confidence score',
    category: 'ai',
    icon: 'git-branch',
    inputs: ['question', 'options', 'contextData', 'criteria'],
    outputs: ['decision', 'confidence', 'rationale', 'branch']
  }),

  validate: (config) => {
    return Boolean(config && config.question && Array.isArray(config.options) && config.options.length > 0);
  },

  execute: async (config, context) => {
    logger.info('Action:AIDecision', `Executing AI decision for project ${context.projectId}`);
    
    if (context.isSimulation) {
      const selected = config.options[0] || 'approved';
      return {
        success: true,
        decision: selected,
        branch: selected,
        confidence: 0.95,
        rationale: 'Simulated decision based on criteria.'
      };
    }

    const prompt = `You are evaluating an SEO automation decision.
Question: ${config.question}
Available Options: ${JSON.stringify(config.options)}
Evaluation Criteria: ${config.criteria || 'Best SEO impact and lowest risk'}
Context Data: ${JSON.stringify(config.contextData || context.variables || {})}

Return a valid JSON object strictly matching this schema:
{
  "decision": "one of the options exactly",
  "branch": "one of the options exactly",
  "confidence": 0.85,
  "rationale": "reason for choice"
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: context.workspaceId || context.projectId,
        projectId: context.projectId,
        agentKey: 'automationAiDecision',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        temperature: 0.2
      });

      const parsed = JSON.parse(response);
      return {
        success: true,
        decision: parsed.decision || config.options[0],
        branch: parsed.branch || parsed.decision || config.options[0],
        confidence: Number(parsed.confidence) || 0.9,
        rationale: parsed.rationale || ''
      };
    } catch (err) {
      logger.error('Action:AIDecision', `AI decision evaluation failed: ${err.message}`);
      return {
        success: true,
        decision: config.options[0],
        branch: config.options[0],
        confidence: 0.5,
        rationale: `Fallback decision due to error: ${err.message}`
      };
    }
  }
};
