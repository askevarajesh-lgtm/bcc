const compromise = require('compromise');

class EntityExtractionService {
  /**
   * Extract NLP entities from text.
   * Compares with competitor entities.
   */
  async extractEntities(text) {
    const doc = compromise(text);
    
    // Extract basic NLP entities
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');
    
    return {
      people: [...new Set(people)],
      locations: [...new Set(places)],
      organizations: [...new Set(organizations)],
      topics: doc.topics().out('array')
    };
  }

  /**
   * Analyze entities required for a primary keyword based on competitors.
   */
  async getRecommendedEntities(keyword) {
    // In production, this would query the competitor graph or a knowledge base.
    return [
      `${keyword} Guide`,
      'Industry Standard',
      'Best Practices',
      'ROI'
    ];
  }
}

module.exports = new EntityExtractionService();
