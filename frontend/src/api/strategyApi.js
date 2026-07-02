import api from '../services/api';

export const strategyApi = {
  getStrategy: async () => {
    const response = await api.get('/strategy');
    return response.data;
  },
  generateStrategy: async () => {
    const response = await api.post('/strategy/generate');
    return response.data;
  },
  addObjective: async (objectiveData) => {
    const response = await api.post('/strategy/objectives', objectiveData);
    return response.data;
  },
  addInitiative: async (initiativeData) => {
    const response = await api.post('/strategy/initiatives', initiativeData);
    return response.data;
  }
};
