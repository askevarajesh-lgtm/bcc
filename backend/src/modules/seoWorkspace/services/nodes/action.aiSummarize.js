const logger = require('../../../aiCore/logger.service');
const aiEngine = require('../../../aiCore/aiEngine.service');

module.exports = {
  id: 'action_ai_summarize',
  
  metadata: () => ({
    id: 'action_ai_summarize',
    name: 'AI Summarizer',
    description: 'Summarizes audit findings, keyword ranking shifts, or crawl reports into executive bullet points',
    category: 'ai',
    icon: 'file-text',
    inputs: ['content', 'maxPoints', 'targetAudience'],
    outputs: ['summary', 'keyFindings', 'actionItems']
  }),

  validate: (config) => Boolean(config && config.content),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        summary: 'Simulated executive summary of SEO performance metrics.',
        keyFindings: ['Rankings stable overall', 'Top 3 keyword gained position #1'],
        actionItems: ['Review technical crawl warnings']
      };
    }

    const prompt = `Summarize the following SEO data for ${config.targetAudience || 'SEO Director & Client'}.
Data: ${typeof config.content === 'string' ? config.content : JSON.stringify(config.content)}
Maximum Bullet Points: ${config.maxPoints || 5}

Return a valid JSON object strictly matching this schema:
{
  "summary": "Executive summary paragraph",
  "keyFindings": ["Finding 1", "Finding 2"],
  "actionItems": ["Action 1", "Action 2"]
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: context.workspaceId || context.projectId,
        projectId: context.projectId,
        agentKey: 'automationAiSummarize',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        temperature: 0.3
      });

      const parsed = JSON.parse(response);
      return {
        success: true,
        summary: parsed.summary || '',
        keyFindings: parsed.keyFindings || [],
        actionItems: parsed.actionItems || []
      };
    } catch (err) {
      throw new Error(`AI summarization failed: ${err.message}`);
    }
  }
};
