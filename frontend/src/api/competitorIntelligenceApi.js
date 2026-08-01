import api from '../services/api';

// AI SEO Platform v2 §0/§12 — thin client over the new
// backend/src/modules/competitorIntelligence module. Mirrors semrushApi.js's
// plain-async-function convention (this module's scope doesn't need the
// hook-factory pattern seoIntelligenceApi.js uses).
export const competitorIntelligenceApi = {
  // ── Existing methods (unchanged) ──────────────────────────────────────────

  /**
   * @param {string} projectId
   * @param {string[]} competitorDomains
   * @param {'keyword_gap'|'content_gap'|'backlink_gap'|'page_gap'|'top_pages'|'overview'} type
   * @param {{ locationCode?: number, languageCode?: string, forceRefresh?: boolean }} [opts]
   */
  runComparison: async (projectId, competitorDomains, type, opts = {}) => {
    const response = await api.post(`/competitor-intelligence/projects/${projectId}/compare`, {
      competitorDomains, type, ...opts
    });
    return response.data.data;
  },

  generateRecommendations: async (projectId, comparisonResult) => {
    const response = await api.post(`/competitor-intelligence/projects/${projectId}/recommendations/generate`, {
      comparisonResult
    });
    return response.data.data;
  },

  getRecommendations: async (projectId, status) => {
    const response = await api.get(`/competitor-intelligence/projects/${projectId}/recommendations`, {
      params: status ? { status } : {}
    });
    return response.data.data;
  },

  dismissRecommendations: async (projectId, recommendationIds) => {
    const response = await api.put(`/competitor-intelligence/projects/${projectId}/recommendations/dismiss`, {
      recommendationIds
    });
    return response.data;
  },

  generateTasks: async (projectId, recommendationIds) => {
    const response = await api.post(`/competitor-intelligence/projects/${projectId}/tasks/generate`, {
      recommendationIds
    });
    return response.data.data;
  },

  getExecutionHistory: async (projectId, limit = 20) => {
    const response = await api.get(`/competitor-intelligence/projects/${projectId}/history`, {
      params: { limit }
    });
    return response.data.data;
  },

  // ── New enterprise methods ─────────────────────────────────────────────────

  /** List all competitors (Suggested + Approved) for a project */
  getCompetitors: async (projectId, status) => {
    const response = await api.get(`/competitor-intelligence/projects/${projectId}/competitors`, {
      params: status ? { status } : {}
    });
    return response.data.data;
  },

  /** Executive summary: totals, averages, scores, threat distribution */
  getCompetitorSummary: async (projectId) => {
    const response = await api.get(`/competitor-intelligence/projects/${projectId}/competitors/summary`);
    return response.data.data;
  },

  /**
   * Trend data grouped by domain (snapshots over time)
   * @param {number} [days=30] - lookback window
   * @param {string} [domain] - optional domain filter
   */
  getCompetitorTrend: async (projectId, days = 30, domain) => {
    const response = await api.get(`/competitor-intelligence/projects/${projectId}/competitors/trend`, {
      params: { days, ...(domain ? { domain } : {}) }
    });
    return response.data.data;
  },

  /** Capture a metrics snapshot for all approved competitors */
  captureSnapshot: async (projectId) => {
    const response = await api.post(`/competitor-intelligence/projects/${projectId}/snapshot`);
    return response.data;
  },

  /** Opportunity buckets from existing recommendations */
  getOpportunities: async (projectId, status) => {
    const response = await api.get(`/competitor-intelligence/projects/${projectId}/opportunities`, {
      params: status ? { status } : {}
    });
    return response.data.data;
  },

  /** Re-compute threat scores for all competitors in a project */
  computeThreatScores: async (projectId, yourMetrics = {}) => {
    const response = await api.post(`/competitor-intelligence/projects/${projectId}/threat-scores`, {
      yourMetrics
    });
    return response.data.data;
  }
};

export default competitorIntelligenceApi;

