import api from './api';

const PREFIX = '/resources';

export const resourcesService = {
  getDashboardData: async (month) => {
    const params = month ? { month } : {};
    const response = await api.get(`${PREFIX}/dashboard`, { params });
    return response.data;
  }
};
