class IssueService {
  generateIssuesAndRecommendations(canonicalDataset) {
    const issues = [];
    const recommendations = [];

    // Analyze SEO Metrics
    if (canonicalDataset.seo) {
      if (canonicalDataset.seo.technicalScore?.value < 80) {
        issues.push({
          severity: 'high',
          category: 'technical',
          title: 'Low Technical SEO Score',
          description: `The technical site health is currently at ${canonicalDataset.seo.technicalScore.value}/100.`
        });
        recommendations.push({
          category: 'technical',
          title: 'Run a Full Technical Audit',
          description: 'Identify and fix broken links, missing meta descriptions, and slow-loading pages to improve technical health.'
        });
      }

      if (canonicalDataset.seo.coreWebVitals?.available && canonicalDataset.seo.coreWebVitals.value < 75) {
        issues.push({
          severity: 'medium',
          category: 'performance',
          title: 'Poor Core Web Vitals',
          description: `Core Web Vitals score is ${canonicalDataset.seo.coreWebVitals.value}, indicating slow page loads or layout shifts.`
        });
        recommendations.push({
          category: 'performance',
          title: 'Optimize Page Speed',
          description: 'Compress images, minify CSS/JS, and implement caching to improve Core Web Vitals.'
        });
      }
    }

    // Analyze Crawler/GEO Metrics
    if (canonicalDataset.geo) {
      if (canonicalDataset.geo.schemaUsage?.available && canonicalDataset.geo.schemaUsage.value < 50) {
        issues.push({
          severity: 'medium',
          category: 'schema',
          title: 'Low Schema.org Coverage',
          description: 'Less than half of the crawled pages contain structured data.'
        });
        recommendations.push({
          category: 'schema',
          title: 'Implement Structured Data',
          description: 'Add Organization, Article, or FAQ schema to key pages to improve rich snippet visibility.'
        });
      }
    }

    return { issues, recommendations };
  }
}

module.exports = new IssueService();
