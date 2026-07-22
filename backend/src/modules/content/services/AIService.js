const axios = require('axios');
const cryptoUtils = require('../../../utils/crypto');
const AiSettings = require('../../aiStudio/models/aiSettings.model');

class AIService {
  async getApiKey(workspaceId) {
    if (!workspaceId) return null;
    let apiKey = null;
    const settings = await AiSettings.findOne({ workspaceId });
    if (settings && settings.openaiApiKey) {
      apiKey = cryptoUtils.decrypt(settings.openaiApiKey);
    }
    return apiKey;
  }

  async generateJSON(prompt, systemPrompt, workspaceId, model = 'gpt-4o-mini') {
    const apiKey = await this.getApiKey(workspaceId);
    if (!apiKey) throw new Error('OpenAI API Key is missing. Please configure it in settings.');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages,
          response_format: { type: "json_object" }
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('AIService generateJSON error:', error.response?.data || error.message);
      return null;
    }
  }

  async humanizeText(text, brandVoice, workspaceId, model = 'gpt-4o-mini') {
    const systemPrompt = require('../prompts/contentHumanizer.prompt');
    const prompt = `Brand Voice: ${brandVoice || 'Professional, engaging'}\n\nDraft:\n${text}`;
    return await this.generateJSON(prompt, systemPrompt, workspaceId, model);
  }
}

module.exports = new AIService();
