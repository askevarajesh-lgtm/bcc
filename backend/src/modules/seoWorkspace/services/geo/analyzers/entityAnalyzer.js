const BaseAnalyzer = require('./BaseAnalyzer');

class EntityAnalyzer extends BaseAnalyzer {
  constructor() {
    super('Entity Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 85; // Base score, assumed decent unless contradictions found
    const evidence = [];
    const recommendations = [];
    const issues = [];
    
    // In a real scenario, this would look at term frequencies, TF-IDF, or NER extraction done during crawl.
    // We mock the deterministic findings based on page title consistency for now.
    const uniqueTitles = new Set(pages.map(p => p.title));
    
    if (uniqueTitles.size === pages.length && pages.length > 5) {
      evidence.push(this.createEvidence('entity', 'low', 'sitewide', 'Entity spread is diverse based on titles.'));
    } else {
      issues.push('Duplicate or highly similar titles detected, diluting core entity focus.');
      score -= 15;
      recommendations.push({
        ruleKey: 'duplicate_title_tags',
        title: 'Resolve Duplicate Titles',
        description: 'Duplicate titles confuse generative engines about the core entity of each page.',
        page: 'sitewide'
      });
    }

    return this.createResult(Math.max(0, score), 80, evidence, issues, recommendations);
  }
}

module.exports = EntityAnalyzer;
