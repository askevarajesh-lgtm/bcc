const BaseAnalyzer = require('./BaseAnalyzer');

class KnowledgeGraphAnalyzer extends BaseAnalyzer {
  constructor() {
    super('Knowledge Graph Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 100;
    const evidence = [];
    const recommendations = [];
    const issues = [];
    
    // Check sameAs links in schema
    let sameAsFound = false;
    pages.forEach(page => {
      if (page.sameAs && page.sameAs.length > 0) {
        sameAsFound = true;
      }
    });

    if (!sameAsFound) {
      score -= 30;
      issues.push('No sameAs properties found in schemas.');
      evidence.push(this.createEvidence('knowledgeGraph', 'high', 'sitewide', 'Missing sameAs links to connect entity to external graph (Wikipedia, LinkedIn, etc.).'));
      recommendations.push({
        ruleKey: 'missing_sameas_links',
        title: 'Add sameAs Links to Schema',
        description: 'sameAs properties help search engines reconcile your entity with existing Knowledge Graph entities.',
        page: 'sitewide'
      });
    }

    return this.createResult(Math.max(0, score), 85, evidence, issues, recommendations);
  }
}

module.exports = KnowledgeGraphAnalyzer;
