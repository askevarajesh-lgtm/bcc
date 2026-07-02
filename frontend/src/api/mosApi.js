import api from '../services/api';

export const mosApi = {
  getMosDashboard: async () => {
    const response = await api.get('/mos/dashboard');
    return response.data;
  },

  updateMosWeights: async (weights) => {
    const response = await api.put('/mos/config', { weights });
    return response.data;
  },

  triggerRecalculation: async () => {
    const response = await api.post('/mos/recalculate', {});
    return response.data;
  }
};
