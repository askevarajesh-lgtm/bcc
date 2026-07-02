import api from '../services/api';

export const supportApi = {
  createSupportTicket: async (data) => {
    const response = await api.post('/support', data);
    return response.data;
  },
  
  getAssignableUsers: async () => {
    const response = await api.get('/support/assignable-users');
    return response.data;
  }
};
