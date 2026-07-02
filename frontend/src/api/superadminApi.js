import api from '../services/api';
export const superadminApi = {
  getCommandCenterData: () => api.get('/superadmin/command-center'),
};
