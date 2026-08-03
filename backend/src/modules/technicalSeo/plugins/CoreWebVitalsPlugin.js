/**
 * CoreWebVitalsPlugin
 * Analyzes CWV metrics.
 */
const BaseAuditPlugin = require('./BaseAuditPlugin');

class CoreWebVitalsPlugin extends BaseAuditPlugin {
  constructor() {
    super();
    this.name = 'Core Web Vitals';
    this.category = 'core_web_vitals';
    this.maxScore = 20; // Maximum weight in overall technical score
  }

  async execute(context) {
    const { pageData } = context;
    // Assuming pageData comes with CWV stats if DataForSEO provider was used
    // or Lighthouse was executed
    return {
      lcp: pageData.cwv?.lcp || null,
      cls: pageData.cwv?.cls || null,
      inp: pageData.cwv?.inp || null,
      status: pageData.cwv ? 'measured' : 'skipped'
    };
  }

  async score(results) {
    if (results.status === 'skipped') return this.maxScore; // Don't penalize if not measured
    
    let currentScore = this.maxScore;
    if (results.lcp > 2500) currentScore -= 5;
    if (results.cls > 0.1) currentScore -= 5;
    if (results.inp > 200) currentScore -= 5;
    
    return Math.max(0, currentScore);
  }

  async recommend(results) {
    const issues = [];
    if (results.lcp > 2500) {
      issues.push({ severity: 'high', code: 'CWV_LCP_POOR', issue: `LCP is ${results.lcp}ms (Poor)` });
    }
    if (results.cls > 0.1) {
      issues.push({ severity: 'medium', code: 'CWV_CLS_POOR', issue: `CLS is ${results.cls} (Needs Improvement)` });
    }
    return issues;
  }
}

module.exports = new CoreWebVitalsPlugin();
