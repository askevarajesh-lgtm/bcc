const ContentAgentRegistryService = require('./ContentAgentRegistryService');
const PromptBuilderService = require('./PromptBuilderService');
const AIService = require('./AIService');
const ContentItemRepository = require('../repositories/ContentItemRepository');
const ContentHistoryRepository = require('../repositories/ContentHistoryRepository');

class ContentOrchestrationService {
  async generate(payload, actor) {
    const { contentType, workspaceId } = payload;
    
    // 1. Resolve agent configuration
    const agentConfig = ContentAgentRegistryService.resolve(contentType);

    // 2. Build prompts
    const { systemPrompt, userPrompt } = PromptBuilderService.buildPrompt(agentConfig, payload);

    // 3. AI Layer: Writer Agent Call
    let draftJson = await AIService.generateJSON(userPrompt, systemPrompt, workspaceId, agentConfig.model);

    if (!draftJson) {
      throw new Error('Content generation failed from AI provider.');
    }

    // 4. AI Layer: Humanizer Pass (if configured)
    if (agentConfig.humanize && draftJson.body) {
      const humanizerResult = await AIService.humanizeText(draftJson.body, payload.brandVoice, workspaceId, agentConfig.model);
      if (humanizerResult && humanizerResult.body) {
        draftJson.body = humanizerResult.body;
      }
    }

    // 5. Validation Layer
    // In a real implementation, we'd run a robust JSON schema validation here.
    // For now, ensuring we got title and body back.
    if (!draftJson.title && !draftJson.body) {
       throw new Error('AI output failed schema validation (missing title/body).');
    }

    // 6. Persistence
    const contentItemData = {
      workspaceId,
      ownerId: actor._id,
      type: contentType,
      status: 'Draft',
      
      // inputs
      topic: payload.topic,
      platform: payload.platform,
      tone: payload.tone,
      brandVoice: payload.brandVoice,
      keyMessage: payload.keyMessage,
      includeOptions: payload.includeOptions,
      characterLimit: payload.characterLimit,
      
      // outputs
      title: draftJson.title || payload.topic,
      body: draftJson.body || '',
      excerpt: draftJson.excerpt || '',
      category: draftJson.category || '',
      metaTitle: draftJson.metaTitle || '',
      metaDescription: draftJson.metaDescription || '',
      keyword: draftJson.keyword || '',
      hashtags: draftJson.hashtags || [],
      cta: draftJson.cta || ''
    };

    const savedItem = await ContentItemRepository.create(contentItemData);

    // 7. Audit Log
    await ContentHistoryRepository.log(
      workspaceId, 
      savedItem._id, 
      'generated', 
      actor._id, 
      { contentType, agent: agentConfig.agent }
    );

    return savedItem;
  }
}

module.exports = new ContentOrchestrationService();
