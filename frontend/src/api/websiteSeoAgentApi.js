// Mirrors backend/src/modules/websites/website.routes.js exactly (the
// existing CRUD list endpoints, plus the page-scoped SEO agent). Same
// axios+Bearer pattern as contentAiApi.js / seoWorkspaceApi.js.
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const websiteSeoAgentApi = {
  // Existing website/page listing (reused as-is, not new backend behavior)
  getWebsites: async () => {
    const res = await axios.get(`${API_URL}/websites`, getAuthHeaders());
    return res.data;
  },
  getWebsiteDetails: async (websiteId) => {
    const res = await axios.get(`${API_URL}/websites/${websiteId}`, getAuthHeaders());
    return res.data;
  },

  // Website Builder SEO agent (per-page)
  runWebsiteSeoAgent: async (websiteId, pageId) => {
    const res = await axios.post(`${API_URL}/websites/${websiteId}/pages/${pageId}/seo-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveWebsiteSeoFindings: async (websiteId, pageId, runId) => {
    const res = await axios.put(`${API_URL}/websites/${websiteId}/pages/${pageId}/seo-agent/${runId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectWebsiteSeoFindings: async (websiteId, pageId, runId, reason) => {
    const res = await axios.put(`${API_URL}/websites/${websiteId}/pages/${pageId}/seo-agent/${runId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getWebsiteSeoHistory: async (websiteId, pageId) => {
    const res = await axios.get(`${API_URL}/websites/${websiteId}/pages/${pageId}/seo-agent/history`, getAuthHeaders());
    return res.data;
  }
};
