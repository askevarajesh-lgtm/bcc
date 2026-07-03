import api from './api';

const PREFIX = '/business-intel';

export const businessIntelService = {
  getDashboardData: async () => {
    const response = await api.get(`${PREFIX}/dashboard`);
    return response.data;
  }
};
