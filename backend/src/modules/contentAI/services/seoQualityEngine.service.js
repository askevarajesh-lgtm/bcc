class SEOQualityEngineService {
  /**
   * Calculates comprehensive SEO score for a given text.
   */
  async calculateScores(content, brief) {
    if (!content) return { seoScore: 0, readabilityScore: 0, entityCoverage: 0 };
    
    // Convert content to lowercase for easier matching
    const lowerContent = content.toLowerCase();
    
    // 1. Keyword Usage Score (0 - 40)
    let keywordScore = 0;
    if (brief.keywords.primary && lowerContent.includes(brief.keywords.primary.toLowerCase())) {
      keywordScore += 20;
    }
    
    let secondaryFound = 0;
    if (brief.keywords.secondary && brief.keywords.secondary.length > 0) {
      brief.keywords.secondary.forEach(kw => {
        if (lowerContent.includes(kw.toLowerCase())) secondaryFound++;
      });
      keywordScore += Math.min((secondaryFound / brief.keywords.secondary.length) * 20, 20);
    } else {
      keywordScore += 20; // Max out if no secondary keywords required
    }
    
    // 2. Entity Coverage Score (0 - 30)
    let entityScore = 0;
    let entitiesFound = 0;
    if (brief.entities.required && brief.entities.required.length > 0) {
      brief.entities.required.forEach(entity => {
         if (lowerContent.includes(entity.toLowerCase())) entitiesFound++;
      });
      entityScore = (entitiesFound / brief.entities.required.length) * 30;
    } else {
      entityScore = 30;
    }
    
    // 3. Structural/Content Score (0 - 30)
    let structureScore = 15; // Base line
    const wordCount = content.split(/\s+/).length;
    
    if (brief.structure.recommendedWordCount > 0) {
      if (wordCount >= brief.structure.recommendedWordCount * 0.8) {
        structureScore += 15;
      } else {
        structureScore += (wordCount / brief.structure.recommendedWordCount) * 15;
      }
    } else {
      structureScore += 15;
    }
    
    const finalSeoScore = Math.min(Math.round(keywordScore + entityScore + structureScore), 100);
    
    // 4. Readability Score (Mocked implementation, ideally Flesch-Kincaid)
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const avgWordsPerSentence = wordCount / (sentences.length || 1);
    
    let readabilityScore = 100;
    if (avgWordsPerSentence > 20) readabilityScore -= (avgWordsPerSentence - 20) * 2; // Penalize long sentences
    readabilityScore = Math.max(Math.round(readabilityScore), 0);

    return {
      seoScore: finalSeoScore,
      readabilityScore,
      entityCoverage: Math.round(entityScore * (100/30))
    };
  }
}

module.exports = new SEOQualityEngineService();
