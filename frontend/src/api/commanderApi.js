import api from '../services/api';

export const commanderApi = {
  getCommandCenterData: () => api.get('/commander/command-center'),
};
