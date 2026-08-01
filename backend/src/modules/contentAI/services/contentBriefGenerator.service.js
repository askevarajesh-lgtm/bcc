const keywordIntelligence = require('./keywordIntelligence.service');
const competitorIntelligence = require('./competitorIntelligence.service');
const serpAnalyzer = require('./serpAnalyzer.service');
const entityExtraction = require('./entityExtraction.service');
const ContentBrief = require('../models/contentBrief.model');

class ContentBriefGeneratorService {
  /**
   * Generates a comprehensive Content Brief for a target keyword.
   */
  async generateBrief(workspaceId, userId, targetKeyword, targetType = 'blogPost') {
    // 1. Keyword Intelligence
    const kwData = await keywordIntelligence.getKeywordData(workspaceId, targetKeyword);
    const secondaryKw = await keywordIntelligence.getSecondaryKeywords(workspaceId, targetKeyword);

    // 2. Competitor Intelligence
    const compData = await competitorIntelligence.analyzeCompetitors(workspaceId, targetKeyword);

    // 3. SERP Analysis
    const serpData = await serpAnalyzer.analyzeSERP(targetKeyword);

    // 4. Entity Extraction
    const recommendedEntities = await entityExtraction.getRecommendedEntities(targetKeyword);

    // Assemble the brief
    const brief = new ContentBrief({
      workspaceId,
      contentPieceId: null, // Will be linked when content is actually generated
      targetAudience: 'General Audience', // This would typically come from Brand Voice or User Input
      searchIntent: kwData.intent,
      keywords: {
        primary: kwData.keyword,
        secondary: secondaryKw,
        longTail: []
      },
      entities: {
        required: recommendedEntities,
        recommended: []
      },
      structure: {
        recommendedWordCount: Math.max(compData.averageWordCount, serpData.averageWordCount) + 300, // Aiming higher than average
        headings: [] // To be generated or filled by user
      },
      competitorInsights: compData,
      tone: 'Professional',
      createdBy: userId
    });

    await brief.save();
    return brief;
  }
}

module.exports = new ContentBriefGeneratorService();
