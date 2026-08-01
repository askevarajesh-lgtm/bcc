import api from '../../../../../api/axios'; // Adjust path depending on structure

export const technicalSeoApi = {
  /**
   * Start a new audit
   */
  startAudit: async (projectId, profile = 'STANDARD') => {
    const response = await api.post('/v1/technical-seo/audit', { projectId, profile });
    return response.data;
  },

  /**
   * Fetch dashboard aggregate data
   */
  getDashboard: async (projectId) => {
    const response = await api.get(`/v1/technical-seo/dashboard?projectId=${projectId}`);
    return response.data;
  },

  /**
   * Fetch specific audit details
   */
  getAudit: async (auditId) => {
    const response = await api.get(`/v1/technical-seo/audit/${auditId}`);
    return response.data;
  }
};
