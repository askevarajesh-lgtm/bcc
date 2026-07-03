import api from './api';

const PREFIX = '/time-tracking';

export const timeTrackingService = {
  logTime: async (data) => {
    const response = await api.post(`${PREFIX}/`, data);
    return response.data;
  },
  getRecentEntries: async () => {
    const response = await api.get(`${PREFIX}/recent`);
    return response.data;
  },
  getDashboardData: async () => {
    const response = await api.get(`${PREFIX}/dashboard`);
    return response.data;
  },
  getFormOptions: async () => {
    const response = await api.get(`${PREFIX}/options`);
    return response.data;
  },
  getTeamTaskPerformance: async () => {
    const response = await api.get(`${PREFIX}/performance`);
    return response.data;
  }
};
