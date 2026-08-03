const aiEngine = require('../../../aiCore/aiEngine.service');

module.exports = {
  id: 'action_ai_classify',
  
  metadata: () => ({
    id: 'action_ai_classify',
    name: 'AI Classifier',
    description: 'Classifies keywords, URLs, search intent, or sentiment into structured categories',
    category: 'ai',
    icon: 'tag',
    inputs: ['input', 'categories', 'allowMultiCategory'],
    outputs: ['category', 'matchedCategories', 'confidence']
  }),

  validate: (config) => Boolean(config && config.input && Array.isArray(config.categories)),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        category: config.categories[0] || 'Informational',
        matchedCategories: [config.categories[0] || 'Informational'],
        confidence: 0.94
      };
    }

    const prompt = `Classify this item into one of the allowed categories: ${JSON.stringify(config.categories)}.
Item: "${config.input}"

Return a valid JSON object:
{
  "category": "exact category from allowed list",
  "matchedCategories": ["category 1"],
  "confidence": 0.9
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: context.workspaceId || context.projectId,
        projectId: context.projectId,
        agentKey: 'automationAiClassify',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        temperature: 0.1
      });

      const parsed = JSON.parse(response);
      return {
        success: true,
        category: parsed.category || config.categories[0],
        matchedCategories: parsed.matchedCategories || [parsed.category || config.categories[0]],
        confidence: Number(parsed.confidence) || 0.9
      };
    } catch (err) {
      return {
        success: true,
        category: config.categories[0],
        matchedCategories: [config.categories[0]],
        confidence: 0.5
      };
    }
  }
};
