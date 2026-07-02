import api from '../services/api';

export const performanceAdsApi = {
  getDashboardData: async () => {
    const response = await api.get('/performance-ads/dashboard');
    return response.data;
  },
  syncData: async () => {
    const response = await api.post('/performance-ads/sync');
    return response.data;
  },
  addCampaign: async (campaignData) => {
    const response = await api.post('/performance-ads/campaign', campaignData);
    return response.data;
  }
};
