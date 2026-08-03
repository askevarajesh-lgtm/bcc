const BaseAnalyzer = require('./BaseAnalyzer');

class ContentAnalyzer extends BaseAnalyzer {
  constructor() {
    super('Content Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 100;
    const evidence = [];
    const recommendations = [];
    const issues = [];

    pages.forEach(page => {
      if (!page.h1) {
        score -= 2;
        evidence.push(this.createEvidence('content', 'high', page.url, 'Missing H1 tag.'));
        recommendations.push({
          ruleKey: 'missing_h1',
          title: 'Add H1 tags',
          description: 'H1 tags are crucial for document structure and understanding.',
          page: page.url
        });
      }

      if (page.wordCount < 300 && page.indexable !== false) {
        score -= 1;
        issues.push(`Page ${page.url} has thin content (${page.wordCount} words).`);
        recommendations.push({
          ruleKey: 'short_content_chunks',
          title: 'Expand Thin Content',
          description: 'Thin content provides less context for AI engines.',
          page: page.url
        });
      }
    });

    return this.createResult(Math.max(0, score), 85, evidence, issues, recommendations);
  }
}

module.exports = ContentAnalyzer;
