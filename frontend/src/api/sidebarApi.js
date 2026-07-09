import api from '../services/api';

export const sidebarApi = {
  getCounts: () => api.get('/sidebar/counts'),
};
