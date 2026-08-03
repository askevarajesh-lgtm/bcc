const BaseAnalyzer = require('./BaseAnalyzer');

class TechnicalAnalyzer extends BaseAnalyzer {
  constructor() {
    super('Technical Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 100;
    const evidence = [];
    const recommendations = [];
    const issues = [];
    
    let missingCanonicalCount = 0;
    
    pages.forEach(page => {
      // Basic deterministic check for canonical and indexability (Assuming crawl provides this)
      if (page.indexable === false) {
        issues.push(`Page ${page.url} is not indexable.`);
        score -= 5;
      }
      
      // In a real crawl, we'd check `page.canonical`
      if (!page.canonical) {
        missingCanonicalCount++;
      }
    });

    if (missingCanonicalCount > 0) {
      score -= (missingCanonicalCount > 5 ? 20 : 10);
      evidence.push(this.createEvidence('technical', 'high', 'sitewide', `${missingCanonicalCount} pages are missing canonical tags.`));
      recommendations.push({
        ruleKey: 'broken_canonical',
        title: 'Fix Missing Canonical Tags',
        description: 'Several pages are missing canonical tags, which can lead to duplicate content issues.',
        page: 'sitewide'
      });
    }

    // Example robots/sitemap check
    if (!context.hasRobotsTxt) {
      score -= 30;
      evidence.push(this.createEvidence('technical', 'critical', 'sitewide', 'robots.txt is missing.'));
      recommendations.push({
        ruleKey: 'missing_robots_txt',
        title: 'Add a robots.txt file',
        description: 'Search engines need a robots.txt file to understand crawling rules.',
        page: 'sitewide'
      });
    }

    return this.createResult(Math.max(0, score), 95, evidence, issues, recommendations);
  }
}

module.exports = TechnicalAnalyzer;
