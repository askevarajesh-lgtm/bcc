const AIReportProvider = require('./aiReportProvider.interface');
const aiEngineService = require('../../../aiCore/aiEngine.service');

class OpenAIReportProvider extends AIReportProvider {
  async generateSection(data, sectionType, tone, workspaceId) {
    const { client: aiClient } = await aiEngineService.getClient(workspaceId);
    
    // Abstracting out the prompt building logic based on sectionType
    const prompt = this._buildPromptForSection(data, sectionType, tone);

    const responseObj = await aiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = responseObj.choices[0].message.content;
    return JSON.parse(content);
  }

  async generateMonolithicReport(data, workspaceId) {
    const { client: aiClient } = await aiEngineService.getClient(workspaceId);
    const prompt = `You are an SEO Reporter. Generate a comprehensive SEO report in Markdown.
    
Context Data:
${JSON.stringify(data, null, 2)}

Write a professional, client-facing report.`;

    const response = await aiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  }

  _buildPromptForSection(data, sectionType, tone) {
    return `You are an SEO Reporter. Generate the ${sectionType} section of the report.
Return your response strictly as a JSON object containing the fields required for this section.

Context Data:
${JSON.stringify(data, null, 2)}

Ensure the tone is ${tone}.
If this is an actionPlan, provide a list of tasks.
If this is an executiveSummary, provide high-level insights.
JSON keys should be camelCase.`;
  }
}

module.exports = new OpenAIReportProvider();
