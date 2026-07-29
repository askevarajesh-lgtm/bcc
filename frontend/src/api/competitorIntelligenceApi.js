import api from '../services/api';

// AI SEO Platform v2 §0/§12 — thin client over the new
// backend/src/modules/competitorIntelligence module. Mirrors semrushApi.js's
// plain-async-function convention (this module's scope doesn't need the
// hook-factory pattern seoIntelligenceApi.js uses).
export const competitorIntelligenceApi = {
  /**
   * @param {string} projectId
   * @param {string[]} competitorDomains
   * @param {'keyword_gap'|'content_gap'|'backlink_gap'|'page_gap'|'overview'} type
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
  }
};

export default competitorIntelligenceApi;
