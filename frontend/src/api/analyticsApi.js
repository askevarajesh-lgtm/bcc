import api from '../services/api';

export const analyticsApi = {
  getAnalytics: async (clientId, dateRange) => {
    const response = await api.get('/analytics', {
      params: { clientId, dateRange }
    });
    return response.data;
  }
};
