import api from '../services/api';

export const analyticsApi = {
  getAnalytics: async (clientId, dateRange) => {
    const response = await api.get('/analytics', {
      params: { clientId, dateRange: dateRange ? JSON.stringify(dateRange) : undefined }
    });
    return response.data;
  }
};