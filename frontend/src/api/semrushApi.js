import api from '../services/api';

export const semrushApi = {
  getDomainOverview: async (domain, database = 'us') => {
    const response = await api.get('/semrush/domain-overview', {
      params: { domain, database }
    });
    return response.data.data;
  },

  getKeywordResearch: async (keyword, database = 'us') => {
    const response = await api.get('/semrush/keyword-research', {
      params: { keyword, database }
    });
    return response.data.data;
  },

  getBacklinksOverview: async (domain) => {
    const response = await api.get('/semrush/backlinks', {
      params: { domain }
    });
    return response.data.data;
  },

  getSiteHealth: async (domain) => {
    const response = await api.get('/semrush/site-health', {
      params: { domain }
    });
    return response.data.data;
  },

  getDomainKeywordsDrilldown: async (domain, limit = 100) => {
    const response = await api.get('/semrush/domain-keywords-drilldown', {
      params: { domain, limit }
    });
    return response.data.data;
  }
};
