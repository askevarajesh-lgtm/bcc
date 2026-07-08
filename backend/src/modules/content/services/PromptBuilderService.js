class PromptBuilderService {
  buildPrompt(agentConfig, payload, context = {}) {
    const { agent } = agentConfig;
    
    // Dynamically load the correct prompt template
    let systemPrompt;
    try {
      systemPrompt = require(`../prompts/${agent}.prompt`);
    } catch (err) {
      systemPrompt = require('../prompts/defaultWriter.prompt');
    }

    const {
      topic,
      platform,
      tone,
      brandVoice,
      keyMessage,
      includeOptions,
      characterLimit
    } = payload;

    const userPromptParts = [];
    if (topic) userPromptParts.push(`Topic: ${topic}`);
    if (platform) userPromptParts.push(`Platform: ${platform}`);
    if (tone) userPromptParts.push(`Tone: ${tone}`);
    if (brandVoice) userPromptParts.push(`Brand Voice: ${brandVoice}`);
    if (keyMessage) userPromptParts.push(`Key Message: ${keyMessage}`);
    if (includeOptions && includeOptions.length > 0) {
      userPromptParts.push(`Include: ${includeOptions.join(', ')}`);
    }
    if (characterLimit) userPromptParts.push(`Character Limit: ${characterLimit}`);

    const userPrompt = userPromptParts.join('\n');

    return { systemPrompt, userPrompt };
  }
}

module.exports = new PromptBuilderService();
