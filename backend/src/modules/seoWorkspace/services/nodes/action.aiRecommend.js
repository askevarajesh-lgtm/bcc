const aiEngine = require('../../../aiCore/aiEngine.service');

module.exports = {
  id: 'action_ai_recommend',
  
  metadata: () => ({
    id: 'action_ai_recommend',
    name: 'AI SEO Recommendations',
    description: 'Generates prescriptive, ready-to-deploy code fixes, title tag improvements, and schema markup',
    category: 'ai',
    icon: 'sparkles',
    inputs: ['issueType', 'url', 'issueDetails', 'currentHtmlOrMeta'],
    outputs: ['recommendations', 'suggestedFixCode', 'estimatedImpact', 'effortLevel']
  }),

  validate: (config) => Boolean(config && config.issueType),

  execute: async (config, context) => {
    if (context.isSimulation) {
      return {
        success: true,
        recommendations: ['Optimize title tag length to 55 characters', 'Add target keyword to H1'],
        suggestedFixCode: '<title>Primary Keyword - Brand Name</title>',
        estimatedImpact: 'High',
        effortLevel: 'Low'
      };
    }

    const prompt = `You are a Senior Technical SEO Architect. Provide actionable remediation for:
Issue Type: ${config.issueType}
URL: ${config.url || 'Target Page'}
Details: ${JSON.stringify(config.issueDetails || {})}
Current Meta/HTML: ${config.currentHtmlOrMeta || 'None provided'}

Return a valid JSON object:
{
  "recommendations": ["Actionable step 1", "Actionable step 2"],
  "suggestedFixCode": "Exact code or text to deploy",
  "estimatedImpact": "High | Medium | Low",
  "effortLevel": "Low | Medium | High"
}`;

    try {
      const response = await aiEngine.complete({
        workspaceId: context.workspaceId || context.projectId,
        projectId: context.projectId,
        agentKey: 'automationAiRecommend',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        temperature: 0.2
      });

      const parsed = JSON.parse(response);
      return {
        success: true,
        recommendations: parsed.recommendations || [],
        suggestedFixCode: parsed.suggestedFixCode || '',
        estimatedImpact: parsed.estimatedImpact || 'Medium',
        effortLevel: parsed.effortLevel || 'Medium'
      };
    } catch (err) {
      throw new Error(`AI recommendation generation failed: ${err.message}`);
    }
  }
};
