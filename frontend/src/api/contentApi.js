// I'll use standard axios with withCredentials.
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

export const contentApi = {
  // Studio
  generateContent: async (payload) => {
    const res = await axios.post(`${API_URL}/content/studio/generate`, payload, getAuthHeaders());
    return res.data;
  },
  regenerateContent: async (payload) => {
    const res = await axios.post(`${API_URL}/content/studio/regenerate`, payload, getAuthHeaders());
    return res.data;
  },
  getIntegrationStatus: async () => {
    const res = await axios.get(`${API_URL}/content/integrations/status`, getAuthHeaders());
    return res.data;
  },

  // Items
  getItems: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await axios.get(`${API_URL}/content/items?${params}`, getAuthHeaders());
    return res.data;
  },
  getItem: async (id) => {
    const res = await axios.get(`${API_URL}/content/items/${id}`, getAuthHeaders());
    return res.data;
  },
  updateItem: async (id, data) => {
    const res = await axios.put(`${API_URL}/content/items/${id}`, data, getAuthHeaders());
    return res.data;
  },
  deleteItem: async (id) => {
    const res = await axios.delete(`${API_URL}/content/items/${id}`, getAuthHeaders());
    return res.data;
  },
  exportItems: async () => {
    const res = await axios.get(`${API_URL}/content/export`, {
      ...getAuthHeaders(),
      responseType: 'blob'
    });
    return res.data;
  },

  // Calendar
  getCalendar: async (month, year) => {
    const res = await axios.get(`${API_URL}/content/calendar?month=${month}&year=${year}`, getAuthHeaders());
    return res.data;
  },
  scheduleItem: async (itemId, data) => {
    const res = await axios.post(`${API_URL}/content/calendar/${itemId}/schedule`, data, getAuthHeaders());
    return res.data;
  },

  // Trends
  getTrends: async (channel = 'general') => {
    const res = await axios.get(`${API_URL}/content/trends?channel=${channel}`, getAuthHeaders());
    return res.data;
  },
  refreshTrends: async (channels) => {
    const res = await axios.post(`${API_URL}/content/trends/refresh`, { channels }, getAuthHeaders());
    return res.data;
  },
  saveIdea: async (trendId) => {
    const res = await axios.post(`${API_URL}/content/trends/${trendId}/save-idea`, {}, getAuthHeaders());
    return res.data;
  }
};
