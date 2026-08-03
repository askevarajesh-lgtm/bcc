const MonitorBase = require('../MonitorBase');
const axios = require('axios');

class RobotsMonitor extends MonitorBase {
  async collect(context) {
    const { project } = context;
    let base = project?.domain ? (project.domain.startsWith('http') ? project.domain : `https://${project.domain}`) : 'https://example.com';
    base = base.replace(/\/+$/, '');
    const url = `${base}/robots.txt`;

    try {
      const res = await axios.get(url, { timeout: 6000, validateStatus: () => true });
      if (res.status === 200 && typeof res.data === 'string') {
        const disallowAll = /Disallow:\s*\/\s*$/m.test(res.data) && !/Allow:\s*\//m.test(res.data);
        const sitemaps = (res.data.match(/Sitemap:\s*(.*)/gi) || []).map(s => s.replace(/Sitemap:\s*/i, '').trim());

        return {
          accessible: true,
          statusCode: 200,
          contentLength: res.data.length,
          disallowAll,
          sitemapsFound: sitemaps.length
        };
      }
      return { accessible: false, statusCode: res.status, disallowAll: false, sitemapsFound: 0 };
    } catch (err) {
      return { accessible: false, statusCode: 0, error: err.message, disallowAll: false, sitemapsFound: 0 };
    }
  }

  async normalize(rawData) {
    return {
      status: rawData.accessible ? 'Accessible' : 'Unreachable',
      statusCode: rawData.statusCode,
      blocksAllCrawlers: rawData.disallowAll,
      sitemapsFound: rawData.sitemapsFound
    };
  }

  async analyze(normalizedData) {
    return {
      isBlocked: normalizedData.blocksAllCrawlers,
      isMissing: normalizedData.status === 'Unreachable' && normalizedData.statusCode === 404
    };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.isBlocked) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'RobotsBlocksAllCrawlers',
        payload: { severity: 'Critical', details: '🚨 robots.txt is actively blocking ALL search engines (Disallow: /)!' }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.isBlocked) return { technicalSeo: -40 };
    if (analysis.isMissing) return { technicalSeo: -5 };
    return { technicalSeo: 5 };
  }
}

module.exports = RobotsMonitor;
