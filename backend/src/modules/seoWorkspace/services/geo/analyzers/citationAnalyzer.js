const BaseAnalyzer = require('./BaseAnalyzer');

class CitationAnalyzer extends BaseAnalyzer {
  constructor() {
    super('Citation Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 75; 
    const evidence = [];
    const recommendations = [];
    const issues = [];
    
    const contentResults = previousResults['contentAnalyzer'];
    if (contentResults && contentResults.score < 50) {
      score -= 25;
      issues.push('Poor content quality lowers citation readiness.');
      recommendations.push({
        ruleKey: 'low_citation_readiness',
        title: 'Improve Content Quality for Citations',
        description: 'Generative engines only cite high-quality, structured content.',
        page: 'sitewide'
      });
    } else {
      score += 15;
    }

    return this.createResult(Math.max(0, Math.min(100, score)), 80, evidence, issues, recommendations);
  }
}

module.exports = CitationAnalyzer;
