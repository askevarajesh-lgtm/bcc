const MonitorBase = require('../MonitorBase');
const axios = require('axios');

class SitemapMonitor extends MonitorBase {
  async collect(context) {
    const { project } = context;
    let base = project?.domain ? (project.domain.startsWith('http') ? project.domain : `https://${project.domain}`) : 'https://example.com';
    base = base.replace(/\/+$/, '');
    const sitemapUrl = `${base}/sitemap.xml`;

    try {
      const res = await axios.get(sitemapUrl, { timeout: 8000, validateStatus: () => true });
      if (res.status === 200 && typeof res.data === 'string') {
        const urlMatches = (res.data.match(/<loc>/gi) || []).length;
        const isSitemapIndex = res.data.includes('<sitemapindex');

        return {
          accessible: true,
          statusCode: 200,
          urlCount: urlMatches,
          isSitemapIndex,
          sitemapUrl
        };
      }
      return { accessible: false, statusCode: res.status, urlCount: 0, sitemapUrl };
    } catch (err) {
      return { accessible: false, statusCode: 0, error: err.message, urlCount: 0, sitemapUrl };
    }
  }

  async normalize(rawData) {
    return {
      status: rawData.accessible ? 'Valid' : 'Error',
      urlCount: rawData.urlCount,
      sitemapUrl: rawData.sitemapUrl,
      statusCode: rawData.statusCode
    };
  }

  async analyze(normalizedData) {
    return {
      isMissing: normalizedData.status === 'Error',
      isEmpty: normalizedData.status === 'Valid' && normalizedData.urlCount === 0
    };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.isMissing) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'SitemapInaccessible',
        payload: { severity: 'High', details: 'sitemap.xml is missing or returned non-200 status.' }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.isMissing) return { indexability: -15 };
    if (analysis.isEmpty) return { indexability: -10 };
    return { indexability: 5 };
  }
}

module.exports = SitemapMonitor;
