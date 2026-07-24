const AiClientWrapper = require('../../../utils/aiClientWrapper');
const cryptoUtils = require('../../../utils/crypto');
const AiSettings = require('../../aiStudio/models/aiSettings.model');

class AIService {
  async getAiConfig(workspaceId) {
    if (!workspaceId) return null;
    let apiKey = null;
    let provider = 'anthropic';
    const settings = await AiSettings.findOne({ workspaceId });
    if (settings) {
      if (settings.contentAnthropicApiKey) {
        apiKey = cryptoUtils.decrypt(settings.contentAnthropicApiKey);
      }
    }
    return { apiKey, provider };
  }

  async generateJSON(prompt, systemPrompt, workspaceId, model = 'claude-3-5-sonnet-20241022') {
    const config = await this.getAiConfig(workspaceId);
    if (!config || !config.apiKey) throw new Error('API Key is missing. Please configure it in AI settings.');

    const aiClient = new AiClientWrapper(config.apiKey, 'anthropic');

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ];

    try {
      const response = await aiClient.chat.completions.create({
        model: 'claude-3-5-sonnet-20241022',
        messages,
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse JSON. Raw content was:', content);
        throw parseError;
      }
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error('AIService generateJSON error:', errorMsg);
      throw new Error(`AI Provider Error: ${errorMsg}`);
    }
  }

  async humanizeText(text, brandVoice, workspaceId, model = 'claude-3-5-sonnet-20241022') {
    const systemPrompt = require('../prompts/contentHumanizer.prompt');
    const prompt = `Brand Voice: ${brandVoice || 'Professional, engaging'}\n\nDraft:\n${text}`;
    return await this.generateJSON(prompt, systemPrompt, workspaceId, model);
  }
}

module.exports = new AIService();
