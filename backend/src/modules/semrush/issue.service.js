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
          title: 'Improve Technical Health',
          description: 'Address the critical errors and warnings identified in the Site Audit to improve the overall health score.'
        });
      }

      const siteHealth = canonicalDataset.seo.siteHealthDetails;
      if (siteHealth) {
        if (Array.isArray(siteHealth.errors) && siteHealth.errors.length > 0) {
          siteHealth.errors.slice(0, 3).forEach(err => {
            recommendations.push({
              category: 'technical',
              title: `Fix Issue #${err.id}`,
              description: `Semrush detected ${err.count} pages with Error ID ${err.id}. Resolve this to improve site health.`
            });
          });
        }
        if (Array.isArray(siteHealth.warnings) && siteHealth.warnings.length > 0) {
          siteHealth.warnings.slice(0, 2).forEach(warn => {
            recommendations.push({
              category: 'performance',
              title: `Review Warning #${warn.id}`,
              description: `Semrush reported ${warn.count} instances of Warning ID ${warn.id}.`
            });
          });
        }
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
