const logger = require('../../../aiCore/logger.service');
const aiEngine = require('../../../aiCore/aiEngine.service');

module.exports = {
  id: 'ai_generate',
  
  metadata: () => ({
    id: 'ai_generate',
    name: 'Generate Content (AI)',
    description: 'Generate high-quality SEO text content, meta tags, or briefs using multi-provider LLM',
    category: 'ai',
    icon: 'cpu',
    inputs: ['prompt', 'model', 'temperature', 'systemPrompt'],
    outputs: ['content', 'modelUsed', 'tokensUsed']
  }),

  validate: (config) => {
    return Boolean(config && config.prompt);
  },

  execute: async (config, context) => {
    logger.info('Action:AIGenerate', `Generating AI content for project ${context.projectId}`);
    
    if (context.isSimulation) {
      return { 
        success: true, 
        content: `[Simulation] Generated output for prompt: "${(config.prompt || '').substring(0, 60)}..."`,
        modelUsed: config.model || 'gpt-4o',
        tokensUsed: 150
      };
    }

    const messages = [];
    if (config.systemPrompt) {
      messages.push({ role: 'system', content: config.systemPrompt });
    } else {
      messages.push({ role: 'system', content: 'You are an elite enterprise SEO AI Assistant. Provide accurate, production-ready SEO output.' });
    }
    messages.push({ role: 'user', content: config.prompt });

    try {
      const response = await aiEngine.complete({
        workspaceId: context.workspaceId || context.projectId,
        projectId: context.projectId,
        agentKey: 'automationWorkflow',
        messages,
        model: config.model,
        temperature: config.temperature !== undefined ? Number(config.temperature) : 0.7,
        maxTokens: config.maxTokens ? Number(config.maxTokens) : 2000
      });

      return {
        success: true,
        content: response,
        modelUsed: config.model || 'default',
        tokensUsed: response.length ? Math.ceil(response.length / 4) : 0
      };
    } catch (err) {
      logger.error('Action:AIGenerate', `AI completion failed: ${err.message}`);
      throw new Error(`AI generation error: ${err.message}`);
    }
  },

  simulate: async (config, context) => {
    return { 
      success: true, 
      simulated: true, 
      content: `[Simulated AI Content for: ${(config.prompt || '').substring(0, 40)}]` 
    };
  }
};
