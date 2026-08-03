/**
 * MetaIndexabilityPlugin
 * Analyzes canonicals, titles, descriptions, and robots tags.
 */
const BaseAuditPlugin = require('./BaseAuditPlugin');

class MetaIndexabilityPlugin extends BaseAuditPlugin {
  constructor() {
    super();
    this.name = 'Meta & Indexability';
    this.category = 'indexability';
    this.maxScore = 30; 
  }

  async execute(context) {
    const { pageData } = context;
    return {
      title: pageData.title || '',
      description: pageData.metaDescription || '',
      h1: pageData.h1 || '',
      canonical: pageData.canonical || '',
      isNoindex: (pageData.metaRobots || '').toLowerCase().includes('noindex'),
      status: pageData.status
    };
  }

  async score(results) {
    let currentScore = this.maxScore;
    
    if (results.status >= 400) return 0;
    
    if (!results.title) currentScore -= 10;
    if (!results.description) currentScore -= 5;
    if (!results.h1) currentScore -= 5;
    if (!results.canonical && !results.isNoindex) currentScore -= 10;

    return Math.max(0, currentScore);
  }

  async recommend(results) {
    const issues = [];
    
    if (results.status >= 400) {
      issues.push({ severity: 'critical', code: 'PAGE_ERROR', issue: `Page returned status ${results.status}` });
    } else {
      if (!results.title) {
        issues.push({ severity: 'high', code: 'MISSING_TITLE', issue: 'Page is missing a title tag.' });
      }
      if (!results.description) {
        issues.push({ severity: 'medium', code: 'MISSING_META_DESC', issue: 'Page is missing a meta description.' });
      }
      if (!results.h1) {
        issues.push({ severity: 'medium', code: 'MISSING_H1', issue: 'Page is missing an H1 tag.' });
      }
      if (!results.canonical && !results.isNoindex) {
        issues.push({ severity: 'high', code: 'MISSING_CANONICAL', issue: 'Indexable page is missing a canonical tag.' });
      }
    }

    return issues;
  }
}

module.exports = new MetaIndexabilityPlugin();
