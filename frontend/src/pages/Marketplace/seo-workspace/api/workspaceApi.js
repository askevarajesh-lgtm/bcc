// Single place for every /seo-workspace axios call, per the Phase 3 plan
// (Step 7). Panels/hooks should never call `axios` directly for this module —
// route paths and payload shapes live here so a future contract change (e.g.
// Phase 7's job-based response) touches one file, not every panel.
import axios from '../../../../services/api';

const BASE = '/seo-workspace';

// --- Projects ---
export const getProjects = (params = {}) => axios.get(`${BASE}/projects`, { params });
export const createProject = (payload) => axios.post(`${BASE}/projects`, payload);
export const updateProjectSettings = (projectId, settings) =>
  axios.put(`${BASE}/projects/${projectId}/settings`, { settings });

// --- Audits ---
export const getAudits = (params = {}) => axios.get(`${BASE}/audits`, { params });
export const runAudit = (projectId) => axios.post(`${BASE}/projects/${projectId}/audit`);

// --- Keywords ---
export const getKeywords = (params = {}) => axios.get(`${BASE}/keywords`, { params });

// --- Strategies ---
export const getStrategies = (params = {}) => axios.get(`${BASE}/strategies`, { params });
export const generateStrategy = (projectId) =>
  axios.post(`${BASE}/projects/${projectId}/generate-strategy`);
export const approveStrategy = (projectId, strategyId) =>
  axios.put(`${BASE}/projects/${projectId}/strategies/${strategyId}/approve`);
export const rejectStrategy = (projectId, strategyId, reason) =>
  axios.put(`${BASE}/projects/${projectId}/strategies/${strategyId}/reject`, { reason });
export const publishStrategy = (projectId, strategyId) =>
  axios.post(`${BASE}/projects/${projectId}/strategies/${strategyId}/publish`);

// --- Analytics ---
export const getAnalytics = (projectId) => axios.get(`${BASE}/projects/${projectId}/analytics`);

// --- Tasks (Approvals Queue) ---
export const getTasks = (projectId, params = {}) =>
  axios.get(`${BASE}/projects/${projectId}/tasks`, { params });
export const updateTaskStatus = (projectId, taskId, status) =>
  axios.put(`${BASE}/projects/${projectId}/tasks/${taskId}/status`, { status });

// --- Reports ---
export const getReports = (projectId, params = {}) =>
  axios.get(`${BASE}/projects/${projectId}/reports`, { params });
export const generateReport = (projectId) =>
  axios.post(`${BASE}/projects/${projectId}/generate-report`);

// --- Dashboard & Search ---
export const getDashboard = () => axios.get(`${BASE}/dashboard`);
export const globalSearch = (q) => axios.get(`${BASE}/search`, { params: { q } });

// --- Comments (polymorphic: targetType is 'Strategy' | 'Task' | 'Report') ---
export const getComments = (targetType, targetId) =>
  axios.get(`${BASE}/${targetType}/${targetId}/comments`);
export const createComment = (targetType, targetId, projectId, body) =>
  axios.post(`${BASE}/${targetType}/${targetId}/comments`, { projectId, body });
export const deleteComment = (commentId) => axios.delete(`${BASE}/comments/${commentId}`);

// --- Attachments (polymorphic, same targetType set as comments) ---
export const getAttachments = (targetType, targetId) =>
  axios.get(`${BASE}/${targetType}/${targetId}/attachments`);
export const createAttachment = (targetType, targetId, projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  return axios.post(`${BASE}/${targetType}/${targetId}/attachments`, formData);
};
export const deleteAttachment = (attachmentId) => axios.delete(`${BASE}/attachments/${attachmentId}`);

// --- History (audit log) ---
export const getProjectHistory = (projectId, params = {}) =>
  axios.get(`${BASE}/projects/${projectId}/history`, { params });
export const getTargetHistory = (targetType, targetId, params = {}) =>
  axios.get(`${BASE}/${targetType}/${targetId}/history`, { params });

// --- Clients (used by the "Assign to Client" picker) ---
export const getAgencyClients = () => axios.get('/brands');
