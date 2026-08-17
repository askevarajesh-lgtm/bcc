import api from '../services/api';

export const semrushApi = {


  getProjects: async () => {
    const response = await api.get('/semrush/projects');
    return response;
  },

  createProject: async (data) => {
    const response = await api.post('/semrush/projects', data);
    return response;
  },

  getProject: async (id) => {
    const response = await api.get(`/semrush/projects/${id}`);
    return response;
  },

  updateProject: async (id, data) => {
    const response = await api.put(`/semrush/projects/${id}`, data);
    return response;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/semrush/projects/${id}`);
    return response;
  },

  refreshProject: async (id, database = 'us') => {
    const response = await api.post(`/semrush/projects/${id}/refresh`, {}, {
      params: { database }
    });
    return response;
  },

  getLatestSnapshot: async (id) => {
    const response = await api.get(`/semrush/projects/${id}/snapshots/latest`);
    return response;
  },

  getHistoricalSnapshots: async (id) => {
    const response = await api.get(`/semrush/projects/${id}/snapshots`);
    return response;
  },

  getKeywordMagicTool: async (id, params) => {
    const response = await api.get(`/semrush/projects/${id}/keyword-magic-tool`, { params });
    return response;
  },

  getTrafficAnalytics: async (id, params) => {
    const response = await api.get(`/semrush/projects/${id}/traffic-analytics`, { params });
    return response;
  },

  getPositionTracking: async (id, force = false) => {
    const response = await api.get(`/semrush/projects/${id}/position-tracking${force ? '?force=true' : ''}`);
    return response;
  },

  configureTracking: async (id, data) => {
    const response = await api.post(`/semrush/projects/${id}/tracking-config`, data);
    return response;
  }};
