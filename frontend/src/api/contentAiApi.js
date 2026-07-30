// Same pattern as contentApi.js (the older content/ module's API client) —
// standard axios with a Bearer token, one function per endpoint. Deliberately
// a separate file/object from contentApi, mirroring the backend's separate
// contentAI/ module (see content-ai-platform-architecture.md §0/§10).
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const contentAiApi = {
  // Generator registry
  getGenerators: async () => {
    const res = await axios.get(`${API_URL}/content-ai/generators`, getAuthHeaders());
    return res.data;
  },

  // Brand Voice
  getBrandVoices: async () => {
    const res = await axios.get(`${API_URL}/content-ai/brand-voices`, getAuthHeaders());
    return res.data;
  },
  createBrandVoice: async (data) => {
    const res = await axios.post(`${API_URL}/content-ai/brand-voices`, data, getAuthHeaders());
    return res.data;
  },
  updateBrandVoice: async (id, data) => {
    const res = await axios.put(`${API_URL}/content-ai/brand-voices/${id}`, data, getAuthHeaders());
    return res.data;
  },
  deleteBrandVoice: async (id) => {
    const res = await axios.delete(`${API_URL}/content-ai/brand-voices/${id}`, getAuthHeaders());
    return res.data;
  },

  // Content Prompt Templates
  getTemplates: async (generatorType) => {
    const params = generatorType ? `?generatorType=${generatorType}` : '';
    const res = await axios.get(`${API_URL}/content-ai/templates${params}`, getAuthHeaders());
    return res.data;
  },
  createTemplate: async (data) => {
    const res = await axios.post(`${API_URL}/content-ai/templates`, data, getAuthHeaders());
    return res.data;
  },
  updateTemplate: async (id, data) => {
    const res = await axios.put(`${API_URL}/content-ai/templates/${id}`, data, getAuthHeaders());
    return res.data;
  },
  deleteTemplate: async (id) => {
    const res = await axios.delete(`${API_URL}/content-ai/templates/${id}`, getAuthHeaders());
    return res.data;
  },

  // Content Pieces / Generation
  generateContent: async (data) => {
    const res = await axios.post(`${API_URL}/content-ai/pieces/generate`, data, getAuthHeaders());
    return res.data;
  },
  regenerateContent: async (id, data) => {
    const res = await axios.post(`${API_URL}/content-ai/pieces/${id}/regenerate`, data, getAuthHeaders());
    return res.data;
  },
  getContentPieces: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await axios.get(`${API_URL}/content-ai/pieces${params ? `?${params}` : ''}`, getAuthHeaders());
    return res.data;
  },
  getContentPiece: async (id) => {
    const res = await axios.get(`${API_URL}/content-ai/pieces/${id}`, getAuthHeaders());
    return res.data;
  },
  getVersions: async (id) => {
    const res = await axios.get(`${API_URL}/content-ai/pieces/${id}/versions`, getAuthHeaders());
    return res.data;
  },
  restoreVersion: async (id, versionId) => {
    const res = await axios.post(`${API_URL}/content-ai/pieces/${id}/restore/${versionId}`, {}, getAuthHeaders());
    return res.data;
  },

  // Workflow
  submitForReview: async (id) => {
    const res = await axios.put(`${API_URL}/content-ai/pieces/${id}/submit-review`, {}, getAuthHeaders());
    return res.data;
  },
  approveContent: async (id) => {
    const res = await axios.put(`${API_URL}/content-ai/pieces/${id}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectContent: async (id, reason) => {
    const res = await axios.put(`${API_URL}/content-ai/pieces/${id}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  publishContent: async (id) => {
    const res = await axios.post(`${API_URL}/content-ai/pieces/${id}/publish`, {}, getAuthHeaders());
    return res.data;
  },

  // Quality
  getQualityScore: async (id) => {
    const res = await axios.get(`${API_URL}/content-ai/pieces/${id}/quality-score`, getAuthHeaders());
    return res.data;
  },
  getQualityReport: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await axios.get(`${API_URL}/content-ai/quality-report${params ? `?${params}` : ''}`, getAuthHeaders());
    return res.data;
  }
};
