// Mirrors backend/src/modules/stores/store.routes.js exactly (the existing
// CRUD list endpoint, plus the store-scoped SEO agent). Same axios+Bearer
// pattern as contentAiApi.js / seoWorkspaceApi.js.
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const storeSeoAgentApi = {
  // Existing store listing (reused as-is, not new backend behavior)
  getStores: async () => {
    const res = await axios.get(`${API_URL}/stores`, getAuthHeaders());
    return res.data;
  },

  // Store SEO agent (per-store)
  runStoreSeoAgent: async (storeId) => {
    const res = await axios.post(`${API_URL}/stores/${storeId}/seo-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveStoreSeoFindings: async (storeId, runId) => {
    const res = await axios.put(`${API_URL}/stores/${storeId}/seo-agent/${runId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectStoreSeoFindings: async (storeId, runId, reason) => {
    const res = await axios.put(`${API_URL}/stores/${storeId}/seo-agent/${runId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getStoreSeoHistory: async (storeId) => {
    const res = await axios.get(`${API_URL}/stores/${storeId}/seo-agent/history`, getAuthHeaders());
    return res.data;
  }
};
