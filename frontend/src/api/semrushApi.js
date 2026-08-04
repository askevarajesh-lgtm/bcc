import api from '../services/api';

export const semrushApi = {
  getDomainOverview: async (domain, database = 'us', force = false) => {
    const response = await api.get('/semrush/domain-overview', {
      params: { domain, database, force }
    });
    return response.data.data;
  },

  getKeywordResearch: async (keyword, database = 'us', force = false) => {
    const response = await api.get('/semrush/keyword-research', {
      params: { keyword, database, force }
    });
    return response.data.data;
  },

  getBacklinksOverview: async (domain, force = false) => {
    const response = await api.get('/semrush/backlinks', {
      params: { domain, force }
    });
    return response.data.data;
  },

  getSiteHealth: async (domain, database = 'us', force = false) => {
    const response = await api.get('/semrush/site-health', {
      params: { domain, database, force }
    });
    return response.data.data;
  },

  getDomainKeywordsDrilldown: async (domain, limit = 100, force = false) => {
    const response = await api.get('/semrush/domain-keywords-drilldown', {
      params: { domain, limit, force }
    });
    return response.data.data;
  },

  getProjects: async () => {
    const response = await api.get('/semrush/projects');
    return response;
  },

  createProject: async (data) => {
    const response = await api.post('/semrush/projects', data);
    return response;
  },

  getProject: async (id) => {
    const response = await api.get(`/semrush/projects/${id}`);
    return response;
  },

  refreshProject: async (id, database = 'us') => {
    const response = await api.post(`/semrush/projects/${id}/refresh`, {}, {
      params: { database }
    });
    return response;
  },

  getCompetitorAnalysis: async (domain, database = 'us', limit = 20, force = false) => {
    const response = await api.get('/semrush/competitor-analysis', {
      params: { domain, database, limit, force }
    });
    return response.data.data;
  },

  getTrafficAnalytics: async (domain, force = false) => {
    const response = await api.get('/semrush/traffic-analytics', {
      params: { domain, force }
    });
    return response.data.data;
  },

  getKeywordMagicTool: async (keyword, database = 'us', matchType = 'phrase', force = false) => {
    const response = await api.get('/semrush/keyword-magic-tool', {
      params: { keyword, database, matchType, force }
    });
    return response.data.data;
  }
};
