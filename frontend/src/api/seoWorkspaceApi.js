// Same pattern as contentAiApi.js — plain axios, Bearer token, one function
// per endpoint. Mirrors backend/src/modules/seoWorkspace/seoWorkspace.routes.js
// exactly; nothing here calls an endpoint that doesn't exist on the backend.
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

const qs = (params = {}) => {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!usable.length) return '';
  return `?${new URLSearchParams(usable).toString()}`;
};

export const seoWorkspaceApi = {
  // --- Settings (Anthropic API key) ---
  getSettingsStatus: async () => {
    const res = await axios.get(`${API_URL}/seo-workspace/settings/api-key`, getAuthHeaders());
    return res.data;
  },
  saveSettings: async (data) => {
    const res = await axios.post(`${API_URL}/seo-workspace/settings/api-key`, data, getAuthHeaders());
    return res.data;
  },

  // --- Projects ---
  getProjects: async (clientId) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects${qs({ clientId })}`, getAuthHeaders());
    return res.data;
  },
  createProject: async (data) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects`, data, getAuthHeaders());
    return res.data;
  },
  updateProjectSettings: async (projectId, settings) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/settings`, { settings }, getAuthHeaders());
    return res.data;
  },

  // --- Dashboard / Search ---
  getDashboard: async () => {
    const res = await axios.get(`${API_URL}/seo-workspace/dashboard`, getAuthHeaders());
    return res.data;
  },
  globalSearch: async (q) => {
    const res = await axios.get(`${API_URL}/seo-workspace/search${qs({ q })}`, getAuthHeaders());
    return res.data;
  },

  // --- Audits (basic + SEO Auditor agent) ---
  getAudits: async (projectId) => {
    const res = await axios.get(`${API_URL}/seo-workspace/audits${qs({ projectId })}`, getAuthHeaders());
    return res.data;
  },
  runAudit: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/audit`, {}, getAuthHeaders());
    return res.data;
  },
  runAuditorAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/seo-auditor/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveAuditFindings: async (projectId, auditId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/seo-auditor/${auditId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectAuditFindings: async (projectId, auditId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/seo-auditor/${auditId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getAuditorHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/seo-auditor/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Keywords (basic + Keyword Research agent) ---
  getKeywords: async (filters = {}) => {
    const res = await axios.get(`${API_URL}/seo-workspace/keywords${qs(filters)}`, getAuthHeaders());
    return res.data;
  },
  runKeywordResearchAgent: async (projectId, seedKeyword) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/keyword-research/run`, { seedKeyword }, getAuthHeaders());
    return res.data;
  },
  approveKeywordSuggestions: async (projectId, keywordIds) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/keyword-research/approve`, { keywordIds }, getAuthHeaders());
    return res.data;
  },
  rejectKeywordSuggestions: async (projectId, keywordIds, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/keyword-research/reject`, { keywordIds, reason }, getAuthHeaders());
    return res.data;
  },
  getKeywordResearchHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/keyword-research/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },
  detectKeywordIntent: async (projectId, keywords) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/keywords/detect-intent`, { keywords }, getAuthHeaders());
    return res.data;
  },
  getRelatedKeywords: async (projectId, keyword) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/keywords/related`, { keyword }, getAuthHeaders());
    return res.data;
  },

  // --- Competitor agent ---
  runCompetitorAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/competitor-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveCompetitorSuggestions: async (projectId, competitorIds) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/competitor-agent/approve`, { competitorIds }, getAuthHeaders());
    return res.data;
  },
  rejectCompetitorSuggestions: async (projectId, competitorIds, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/competitor-agent/reject`, { competitorIds, reason }, getAuthHeaders());
    return res.data;
  },
  getCompetitorHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/competitor-agent/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Technical SEO agent ---
  runTechnicalSeoAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/technical-seo-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  generateTechnicalFixes: async (projectId, auditId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/technical-seo-agent/${auditId}/generate-fixes`, {}, getAuthHeaders());
    return res.data;
  },
  approveTechnicalFindings: async (projectId, auditId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/technical-seo-agent/${auditId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectTechnicalFindings: async (projectId, auditId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/technical-seo-agent/${auditId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getTechnicalSeoHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/technical-seo-agent/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Content agent (content briefs — distinct from /content-ai) ---
  runContentAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/content-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveContentBriefs: async (projectId, contentBriefId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/content-agent/${contentBriefId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectContentBriefs: async (projectId, contentBriefId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/content-agent/${contentBriefId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getContentAgentHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/content-agent/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Schema agent ---
  runSchemaAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/schema-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveSchemaMarkup: async (projectId, markupId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/schema-agent/${markupId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectSchemaMarkup: async (projectId, markupId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/schema-agent/${markupId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getSchemaAgentHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/schema-agent/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Internal linking agent ---
  runInternalLinkingAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/internal-linking-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveInternalLinkSuggestions: async (projectId, linkRunId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/internal-linking-agent/${linkRunId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectInternalLinkSuggestions: async (projectId, linkRunId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/internal-linking-agent/${linkRunId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getInternalLinkingHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/internal-linking-agent/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Image SEO agent ---
  runImageSeoAgent: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/image-seo-agent/run`, {}, getAuthHeaders());
    return res.data;
  },
  approveImageSeoRecommendations: async (projectId, imageSeoRunId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/image-seo-agent/${imageSeoRunId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectImageSeoRecommendations: async (projectId, imageSeoRunId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/image-seo-agent/${imageSeoRunId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  getImageSeoHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/image-seo-agent/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },

  // --- Strategies (used by Dashboard/Approvals) ---
  getStrategies: async (projectId) => {
    const res = await axios.get(`${API_URL}/seo-workspace/strategies${qs({ projectId })}`, getAuthHeaders());
    return res.data;
  },
  generateStrategy: async (projectId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/generate-strategy`, {}, getAuthHeaders());
    return res.data;
  },
  approveStrategy: async (projectId, strategyId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/strategies/${strategyId}/approve`, {}, getAuthHeaders());
    return res.data;
  },
  rejectStrategy: async (projectId, strategyId, reason) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/strategies/${strategyId}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },
  publishStrategy: async (projectId, strategyId) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/strategies/${strategyId}/publish`, {}, getAuthHeaders());
    return res.data;
  },

  // --- Tasks (Approvals Queue) ---
  getTasks: async (projectId) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/tasks`, getAuthHeaders());
    return res.data;
  },
  updateTaskStatus: async (projectId, taskId, status) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/tasks/${taskId}/status`, { status }, getAuthHeaders());
    return res.data;
  },
  verifyTask: async (projectId, taskId) => {
    const res = await axios.put(`${API_URL}/seo-workspace/projects/${projectId}/tasks/${taskId}/verify`, {}, getAuthHeaders());
    return res.data;
  },

  // --- Reports ---
  getReports: async (projectId) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/reports`, getAuthHeaders());
    return res.data;
  },
  generateReport: async (projectId, data = {}) => {
    const res = await axios.post(`${API_URL}/seo-workspace/projects/${projectId}/generate-report`, data, getAuthHeaders());
    return res.data;
  },

  // --- Comments (polymorphic: targetType is 'Strategy' | 'Task' | 'Report') ---
  getComments: async (targetType, targetId) => {
    const res = await axios.get(`${API_URL}/seo-workspace/${targetType}/${targetId}/comments`, getAuthHeaders());
    return res.data;
  },
  createComment: async (targetType, targetId, data) => {
    const res = await axios.post(`${API_URL}/seo-workspace/${targetType}/${targetId}/comments`, data, getAuthHeaders());
    return res.data;
  },
  deleteComment: async (commentId) => {
    const res = await axios.delete(`${API_URL}/seo-workspace/comments/${commentId}`, getAuthHeaders());
    return res.data;
  },

  // --- History (per-project or per-target) ---
  getProjectHistory: async (projectId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/projects/${projectId}/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  },
  getTargetHistory: async (targetType, targetId, limit) => {
    const res = await axios.get(`${API_URL}/seo-workspace/${targetType}/${targetId}/history${qs({ limit })}`, getAuthHeaders());
    return res.data;
  }
};