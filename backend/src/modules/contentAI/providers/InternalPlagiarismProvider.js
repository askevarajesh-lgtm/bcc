const BasePlagiarismProvider = require('./BasePlagiarismProvider');

class InternalPlagiarismProvider extends BasePlagiarismProvider {
  constructor(config = {}) {
    super(config);
  }

  async checkPlagiarism(text) {
    // Basic probabilistic implementation for MVP
    // In a real system, this would tokenize and compare against a database/index.
    
    // Simulate some simple duplicate sentence detection
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let duplicateCount = 0;
    const duplicates = [];

    // Simple self-duplication check for testing logic
    const seen = new Set();
    sentences.forEach(sentence => {
      const normalized = sentence.trim().toLowerCase();
      if (normalized.length > 20) {
        if (seen.has(normalized)) {
          duplicateCount++;
          duplicates.push(sentence.trim());
        } else {
          seen.add(normalized);
        }
      }
    });

    // Dummy external similarity score (always 0 for now since it's an internal test)
    const similarityScore = (duplicateCount / (sentences.length || 1)) * 100;

    return {
      similarityScore: Math.min(similarityScore, 100),
      duplicateSentences: duplicates,
      originalSources: []
    };
  }
}

module.exports = InternalPlagiarismProvider;
