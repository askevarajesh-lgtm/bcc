const BaseAnalyzer = require('./BaseAnalyzer');

class EEATAnalyzer extends BaseAnalyzer {
  constructor() {
    super('EEAT Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 100;
    const evidence = [];
    const recommendations = [];
    const issues = [];
    
    const hasAboutPage = pages.some(p => p.url.includes('/about'));
    const hasContactPage = pages.some(p => p.url.includes('/contact'));

    if (!hasAboutPage) {
      score -= 20;
      evidence.push(this.createEvidence('eeat', 'high', 'sitewide', 'Missing About page.'));
    }
    if (!hasContactPage) {
      score -= 20;
      evidence.push(this.createEvidence('eeat', 'high', 'sitewide', 'Missing Contact page.'));
    }

    if (!hasAboutPage || !hasContactPage) {
      recommendations.push({
        ruleKey: 'missing_trust_pages',
        title: 'Add Trust Pages (About/Contact)',
        description: 'Generative engines rely on About and Contact pages to verify the legitimacy of the entity.',
        page: 'sitewide'
      });
    }

    return this.createResult(Math.max(0, score), 90, evidence, issues, recommendations);
  }
}

module.exports = EEATAnalyzer;
