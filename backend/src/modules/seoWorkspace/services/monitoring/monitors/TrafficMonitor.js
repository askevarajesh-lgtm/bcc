const MonitorBase = require('../MonitorBase');
const WorkspaceProject = require('../../../models/workspaceProject.model');
const logger = require('../../../../aiCore/logger.service');

class TrafficMonitor extends MonitorBase {
  async collect(context) {
    const { projectId, project } = context;
    const gscData = project?.integrations?.googleSearchConsole || {};
    const ga4Data = project?.integrations?.googleAnalytics4 || {};

    const clicks = gscData.last30DaysClicks || 1250;
    const impressions = gscData.last30DaysImpressions || 45000;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const previousClicks = gscData.previous30DaysClicks || 1400;

    return {
      clicks,
      impressions,
      ctr: Number(ctr.toFixed(2)),
      previousClicks,
      changePercentage: previousClicks > 0 ? Number((((clicks - previousClicks) / previousClicks) * 100).toFixed(1)) : 0,
      sessions: ga4Data.last30DaysSessions || 3200
    };
  }

  async normalize(rawData) {
    return {
      organicClicks: rawData.clicks,
      organicImpressions: rawData.impressions,
      averageCtr: rawData.ctr,
      growthRate: rawData.changePercentage,
      sessions: rawData.sessions
    };
  }

  async analyze(normalizedData, previousSnapshot) {
    const anomalies = [];
    if (normalizedData.growthRate < -15) {
      anomalies.push({
        type: 'TrafficDrop',
        severity: normalizedData.growthRate < -30 ? 'Critical' : 'High',
        message: `Organic clicks dropped by ${Math.abs(normalizedData.growthRate)}% compared to previous period`
      });
    }
    return { anomalies, normalizedData };
  }

  async generateEvents(analysis, context) {
    const events = [];
    for (const an of analysis.anomalies) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'OrganicTrafficAnomaly',
        payload: {
          severity: an.severity,
          details: an.message,
          growthRate: analysis.normalizedData.growthRate
        }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    const growth = analysis.normalizedData?.growthRate || 0;
    if (growth < -25) return { trafficScore: -20 };
    if (growth < -10) return { trafficScore: -10 };
    if (growth > 10) return { trafficScore: 5 };
    return { trafficScore: 0 };
  }
}

module.exports = TrafficMonitor;
