const MonitorBase = require('./MonitorBase');
const WorkspaceKeyword = require('../../models/workspaceKeyword.model');
const rankTrackingService = require('../../services/rankTracking.service');

class KeywordMonitor extends MonitorBase {
  /**
   * Collect raw data by triggering rankTrackingService
   */
  async collect(context) {
    const { projectId } = context;
    const keywords = await WorkspaceKeyword.find({ projectId, isDeleted: false });
    
    if (keywords.length === 0) {
      return { status: 'NO_KEYWORDS', processed: 0, keywords: [] };
    }

    const result = await rankTrackingService.trackKeywords(context.project, keywords);
    
    // Fetch updated keywords after tracking
    const updatedKeywords = await WorkspaceKeyword.find({ projectId, isDeleted: false }).lean();
    return { ...result, keywords: updatedKeywords };
  }

  /**
   * Normalize into snapshot shape
   */
  async normalize(rawData) {
    const keywords = rawData.keywords || [];
    let top3 = 0, top10 = 0, top100 = 0, total = keywords.length;
    
    keywords.forEach(kw => {
      const rank = kw.ranking?.currentRank;
      if (rank) {
        if (rank <= 3) top3++;
        if (rank <= 10) top10++;
        if (rank <= 100) top100++;
      }
    });

    return {
      top3,
      top10,
      top100,
      total,
      distribution: { top3, top10, top100, outOf100: total - top100 }
    };
  }

  /**
   * Analyze for rank drops to generate events
   */
  async analyze(normalizedData, previousSnapshot, rawData = {}) {
    const drops = [];
    const keywords = rawData.keywords || [];
    
    keywords.forEach(kw => {
      const rankChange = kw.ranking?.rankChange || 0;
      const trend = kw.ranking?.trend;
      
      // If trend declined significantly, or lost visibility completely
      if ((trend === 'Declined' && rankChange < -2) || trend === 'Lost Visibility') {
        drops.push({
          keywordId: kw._id,
          keyword: kw.keyword,
          previousRank: kw.ranking.previousRank,
          currentRank: kw.ranking.currentRank,
          dropAmount: Math.abs(rankChange) || 100,
          url: kw.ranking.url
        });
      }
    });

    return { drops, normalizedData };
  }

  /**
   * Generate Events
   */
  async generateEvents(analysis, context) {
    const events = [];
    const { projectId } = context;
    
    for (const drop of analysis.drops) {
      events.push({
        source: this.name,
        projectId,
        eventType: 'KeywordDropped',
        payload: {
          entityId: drop.keywordId,
          entityType: 'Keyword',
          severity: drop.dropAmount > 10 || drop.currentRank === null ? 'High' : 'Medium',
          details: `Keyword "${drop.keyword}" dropped from ${drop.previousRank} to ${drop.currentRank || '100+'}`,
          rawDropData: drop
        }
      });
    }

    return events;
  }

  async generateHealthImpact(analysis) {
    const dropCount = analysis.drops.length;
    if (dropCount > 10) return { ranking: -20 };
    if (dropCount > 5) return { ranking: -10 };
    if (dropCount > 0) return { ranking: -5 };
    return { ranking: 0 };
  }
}

module.exports = KeywordMonitor;
