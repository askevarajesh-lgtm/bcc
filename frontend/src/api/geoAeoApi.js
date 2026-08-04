import api from '../services/api';

export const geoAeoApi = {
  getDashboardData: async (projectId) => {
    return await api.get(`/seo-intelligence/websites/${projectId}/geo-aeo-dashboard`);
  },
  refreshScores: async (projectId) => {
    return await api.post(`/seo-intelligence/websites/${projectId}/geo-aeo-refresh`);
  }
};
