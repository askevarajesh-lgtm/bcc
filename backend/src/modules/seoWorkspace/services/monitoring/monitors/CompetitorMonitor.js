const MonitorBase = require('../MonitorBase');
const WorkspaceKeyword = require('../../../models/workspaceKeyword.model');

class CompetitorMonitor extends MonitorBase {
  async collect(context) {
    const { projectId } = context;
    const keywords = await WorkspaceKeyword.find({ projectId, isDeleted: false, 'competitorRanks.0': { $exists: true } }).lean();

    const shifts = [];
    keywords.forEach(kw => {
      (kw.competitorRanks || []).forEach(comp => {
        const ourRank = kw.ranking?.currentRank || 999;
        const compRank = comp.rank || 999;
        if (compRank < ourRank && comp.previousRank >= ourRank) {
          shifts.push({
            keyword: kw.keyword,
            competitorDomain: comp.domain,
            competitorRank: compRank,
            ourRank
          });
        }
      });
    });

    return { shifts, monitoredKeywordsCount: keywords.length };
  }

  async normalize(rawData) {
    return {
      overtakeCount: rawData.shifts.length,
      shifts: rawData.shifts,
      monitoredKeywords: rawData.monitoredKeywordsCount
    };
  }

  async analyze(normalizedData) {
    return {
      overtakes: normalizedData.shifts,
      isHighThreat: normalizedData.overtakeCount > 5
    };
  }

  async generateEvents(analysis, context) {
    const events = [];
    for (const shift of analysis.overtakes) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'CompetitorRankOvertake',
        payload: {
          severity: 'High',
          competitorDomain: shift.competitorDomain,
          keyword: shift.keyword,
          details: `Competitor ${shift.competitorDomain} outranked you on "${shift.keyword}" (Rank ${shift.competitorRank} vs ${shift.ourRank})`
        }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.overtakes.length > 5) return { competitorScore: -15 };
    if (analysis.overtakes.length > 0) return { competitorScore: -5 };
    return { competitorScore: 0 };
  }
}

module.exports = CompetitorMonitor;
