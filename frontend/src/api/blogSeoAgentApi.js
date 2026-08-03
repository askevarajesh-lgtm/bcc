// Mirrors backend/src/modules/blogs/blog.routes.js exactly (the existing
// CRUD list endpoints, plus the post-scoped SEO agent). Same axios+Bearer
// pattern as contentAiApi.js / seoWorkspaceApi.js.
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const blogSeoAgentApi = {
  // Existing blog/post listing (reused as-is, not new backend behavior)
  getBlogs: async () => {
    const res = await axios.get(`${API_URL}/blogs`, getAuthHeaders());
    return res.data;
  },
  getPosts: async (blogId) => {
    const res = await axios.get(`${API_URL}/blogs/${blogId}/posts`, getAuthHeaders());
    return res.data;
  },

  // Blog SEO agent (per-post)
  runBlogSeoAgent: async (blogId, postId) => {
    const res = await axios.post(`${API_URL}/blogs/${blogId}/posts/${postId}/seo-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveBlogSeoFindings: async (blogId, postId, runId) => {
    const res = await axios.put(`${API_URL}/blogs/${blogId}/posts/${postId}/seo-agent/${runId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectBlogSeoFindings: async (blogId, postId, runId, reason) => {
    const res = await axios.put(`${API_URL}/blogs/${blogId}/posts/${postId}/seo-agent/${runId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getBlogSeoHistory: async (blogId, postId) => {
    const res = await axios.get(`${API_URL}/blogs/${blogId}/posts/${postId}/seo-agent/history`, getAuthHeaders());
    return res.data;
  }
};
