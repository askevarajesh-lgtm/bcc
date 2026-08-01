const BaseAnalyzer = require('./BaseAnalyzer');

class SchemaAnalyzer extends BaseAnalyzer {
  constructor() {
    super('Schema Analyzer', '1.0');
  }

  async analyze(pages, context, previousResults) {
    let score = 100;
    const evidence = [];
    const recommendations = [];
    const issues = [];
    
    let hasOrgSchema = false;

    pages.forEach(page => {
      if (page.schemas && page.schemas.includes('Organization')) {
        hasOrgSchema = true;
      }
      
      if (!page.hasExistingFaqSchema && page.wordCount > 1000) {
        // High word count without FAQ might be a missed opportunity
        evidence.push(this.createEvidence('schema', 'medium', page.url, 'Long-form content missing FAQ schema.'));
        recommendations.push({
          ruleKey: 'missing_faq_schema',
          title: 'Add FAQ Schema to long content',
          description: 'Pages with substantial content can often benefit from FAQ schema to capture rich snippets.',
          page: page.url
        });
      }
    });

    if (!hasOrgSchema) {
      score -= 40;
      evidence.push(this.createEvidence('schema', 'critical', 'sitewide', 'Missing Organization schema anywhere on the site.'));
      recommendations.push({
        ruleKey: 'missing_organization_schema',
        title: 'Implement Organization Schema',
        description: 'Generative engines rely on Organization schema to understand entity basics.',
        page: 'sitewide'
      });
    }

    return this.createResult(Math.max(0, score), 90, evidence, issues, recommendations);
  }
}

module.exports = SchemaAnalyzer;
