import api from '../services/api';

export const mosApi = {
  getMosDashboard: async (clientId = 'all') => {
    const response = await api.get('/mos/dashboard', { params: { clientId } });
    return response.data;
  },

  updateMosWeights: async (weights) => {
    const response = await api.put('/mos/config', { weights });
    return response.data;
  },

  triggerRecalculation: async (clientId = 'all') => {
    const response = await api.post('/mos/recalculate', { clientId });
    return response.data;
  },

  generateActionPlan: async (clientId, weakestSignals) => {
    const response = await api.post('/mos/action-plan', { clientId, weakestSignals });
    return response.data;
  }
};
