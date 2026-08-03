const MonitorBase = require('../MonitorBase');
const WorkspaceKeyword = require('../../../models/workspaceKeyword.model');

class AIVisibilityMonitor extends MonitorBase {
  async collect(context) {
    const { projectId, project } = context;
    const keywords = await WorkspaceKeyword.find({ projectId, isDeleted: false }).limit(20).lean();

    const brandName = project?.name || (project?.domain ? project.domain.split('.')[0] : 'Brand');
    let citedQueries = 0;
    const citations = [];

    keywords.forEach(kw => {
      // Check if tracked keyword has AI citations recorded
      const hasCitation = kw.aiOverview?.cited || kw.ranking?.isAiOverview;
      if (hasCitation) {
        citedQueries++;
        citations.push({
          keyword: kw.keyword,
          engine: kw.aiOverview?.engine || 'ChatGPT / SearchGPT',
          citationUrl: kw.aiOverview?.citationUrl || project?.domain
        });
      }
    });

    const aiVisibilityScore = keywords.length > 0 ? Math.round((citedQueries / keywords.length) * 100) : 50;

    return {
      monitoredKeywords: keywords.length,
      citedQueries,
      aiVisibilityScore,
      citations
    };
  }

  async normalize(rawData) {
    return {
      score: rawData.aiVisibilityScore,
      citedQueriesCount: rawData.citedQueries,
      totalTracked: rawData.monitoredKeywords,
      citations: rawData.citations,
      status: rawData.aiVisibilityScore >= 40 ? 'High' : rawData.aiVisibilityScore >= 15 ? 'Moderate' : 'Low'
    };
  }

  async analyze(normalizedData) {
    return {
      isLowVisibility: normalizedData.score < 15,
      isLeader: normalizedData.score >= 50
    };
  }

  async generateEvents(analysis, context) {
    const events = [];
    if (analysis.isLowVisibility) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'LowAIVisibilityAlert',
        payload: { severity: 'Medium', details: 'Brand has low citation presence in AI LLM search responses (ChatGPT, Perplexity).' }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.isLowVisibility) return { aiVisibility: -5 };
    if (analysis.isLeader) return { aiVisibility: 10 };
    return { aiVisibility: 0 };
  }
}

module.exports = AIVisibilityMonitor;
