const MonitorBase = require('../MonitorBase');
const axios = require('axios');

class UptimeMonitor extends MonitorBase {
  async collect(context) {
    const { project } = context;
    const url = project?.domain ? (project.domain.startsWith('http') ? project.domain : `https://${project.domain}`) : 'https://example.com';

    const start = Date.now();
    try {
      const res = await axios.get(url, { timeout: 8000, validateStatus: () => true });
      const latencyMs = Date.now() - start;
      const isUp = res.status >= 200 && res.status < 400;

      return {
        url,
        isUp,
        statusCode: res.status,
        latencyMs,
        uptimePercentage: isUp ? 100 : 0
      };
    } catch (err) {
      return {
        url,
        isUp: false,
        statusCode: 0,
        latencyMs: Date.now() - start,
        error: err.message,
        uptimePercentage: 0
      };
    }
  }

  async normalize(rawData) {
    return {
      status: rawData.isUp ? 'Online' : 'Offline',
      latencyMs: rawData.latencyMs,
      statusCode: rawData.statusCode,
      uptimePercentage: rawData.uptimePercentage
    };
  }

  async analyze(normalizedData) {
    return {
      isDown: normalizedData.status === 'Offline',
      isSlow: normalizedData.latencyMs > 3000
    };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.isDown) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'EndpointDowntime',
        payload: {
          severity: 'Critical',
          statusCode: analysis.normalizedData?.statusCode || 0,
          details: `Target URL is DOWN or unreachable!`
        }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.isDown) return { uptime: -50 };
    if (analysis.isSlow) return { uptime: -10 };
    return { uptime: 10 };
  }
}

module.exports = UptimeMonitor;
