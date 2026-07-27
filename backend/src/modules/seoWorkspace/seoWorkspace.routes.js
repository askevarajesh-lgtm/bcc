const express = require('express');
const router = express.Router();
const workspaceController = require('./seoWorkspace.controller');
const { verifyToken } = require('../../middlewares/rbac.middleware');
const uploadAttachment = require('./middlewares/uploadAttachment');

// Phase 1 critical fix: seoWorkspace previously used `authMiddleware`, which
// silently mints a sandbox identity for any request with no/invalid token —
// i.e. every route here was reachable unauthenticated. `rbac.middleware.verifyToken`
// is the same pattern already used by other modules (projects, mos, strategy,
// integrations) and correctly rejects missing/invalid tokens with 401/400.
//
// Local/dev workflow: log in via POST /api/auth/signin to get a real JWT and
// send it as `Authorization: Bearer <token>`. The frontend already does this
// automatically (see frontend/src/services/api.js) for any authenticated
// session, so this only removes the *unauthenticated* fallback, not normal use.
router.use(verifyToken);

// Client/brand-side roles get read-only access to this module (mirrors the
// `isViewOnly` role list already used both in the frontend and in
// getProjects' isClientRole check) — writes are reserved for agency-side users.
const VIEW_ONLY_ROLES = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'];
const blockViewOnly = (req, res, next) => {
  if (VIEW_ONLY_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden. Your role has read-only access to SEO Workspace.' });
  }
  next();
};

// API Key Settings
router.get('/settings/api-key', workspaceController.getSettingsStatus);
router.post('/settings/api-key', workspaceController.saveSettings);

// Projects
router.route('/projects')
  .get(workspaceController.getProjects)
  .post(blockViewOnly, workspaceController.createProject);

router.put('/projects/:projectId/settings', blockViewOnly, workspaceController.updateSettings);

// Audits
router.get('/audits', workspaceController.getAudits);
router.post('/projects/:projectId/audit', blockViewOnly, workspaceController.runAudit);

// SEO Auditor Agent — full AI-analyzed run (own prompt/service/execution
// history/logs/retry/approval/shared memory). No UI route consumes this;
// exposed for manual/cron/agent-to-agent triggering. Distinct from the
// plain /audit route above, which only does the raw, non-AI data collection.
router.post('/projects/:projectId/seo-auditor/run', blockViewOnly, workspaceController.runAuditorAgent);
router.put('/projects/:projectId/seo-auditor/:auditId/approve', blockViewOnly, workspaceController.approveAuditFindings);
router.put('/projects/:projectId/seo-auditor/:auditId/reject', blockViewOnly, workspaceController.rejectAuditFindings);
router.get('/projects/:projectId/seo-auditor/history', workspaceController.getAuditorExecutionHistory);

// Keyword Research Agent — own prompt/service/execution history/logs/retry/
// approval/shared memory. No UI route consumes this; exposed for manual/
// cron/agent-to-agent triggering, same rationale as the SEO Auditor routes.
router.post('/projects/:projectId/keyword-research/run', blockViewOnly, workspaceController.runKeywordResearchAgent);
router.put('/projects/:projectId/keyword-research/approve', blockViewOnly, workspaceController.approveKeywordSuggestions);
router.put('/projects/:projectId/keyword-research/reject', blockViewOnly, workspaceController.rejectKeywordSuggestions);
router.get('/projects/:projectId/keyword-research/history', workspaceController.getKeywordResearchExecutionHistory);

// Competitor Agent — own prompt/service/execution history/logs/retry/
// approval/shared memory. No UI route consumes this; exposed for manual/
// cron/agent-to-agent triggering, same rationale as the SEO Auditor and
// Keyword Research agents' routes above.
router.post('/projects/:projectId/competitor-agent/run', blockViewOnly, workspaceController.runCompetitorAgent);
router.put('/projects/:projectId/competitor-agent/approve', blockViewOnly, workspaceController.approveCompetitorSuggestions);
router.put('/projects/:projectId/competitor-agent/reject', blockViewOnly, workspaceController.rejectCompetitorSuggestions);
router.get('/projects/:projectId/competitor-agent/history', workspaceController.getCompetitorExecutionHistory);

// Technical SEO Agent — own prompt/service/execution history/logs/retry/
// approval/shared memory. No UI route consumes this; exposed for manual/
// cron/agent-to-agent triggering, same rationale as the other three agents'
// routes above. Approve/reject take :auditId in the path (not a bulk-ids
// body) because findings live on one WorkspaceTechnicalAudit document per
// run — same shape as the SEO Auditor's routes, not the Competitor/Keyword
// agents' bulk-suggestion shape.
router.post('/projects/:projectId/technical-seo-agent/run', blockViewOnly, workspaceController.runTechnicalSeoAgent);
router.put('/projects/:projectId/technical-seo-agent/:auditId/approve', blockViewOnly, workspaceController.approveTechnicalFindings);
router.put('/projects/:projectId/technical-seo-agent/:auditId/reject', blockViewOnly, workspaceController.rejectTechnicalFindings);
router.get('/projects/:projectId/technical-seo-agent/history', workspaceController.getTechnicalSeoExecutionHistory);

// Content Agent — own prompt/service/execution history/logs/retry/approval/
// shared memory. No UI route consumes this; exposed for manual/cron/
// agent-to-agent triggering, same rationale as the other four agents'
// routes above. Approve/reject take :contentBriefId in the path (not a
// bulk-ids body) because briefs live on one WorkspaceContentBrief document
// per run — same shape as the SEO Auditor/Technical SEO agents' routes,
// not the Competitor/Keyword agents' bulk-suggestion shape.
router.post('/projects/:projectId/content-agent/run', blockViewOnly, workspaceController.runContentAgent);
router.put('/projects/:projectId/content-agent/:contentBriefId/approve', blockViewOnly, workspaceController.approveContentBriefs);
router.put('/projects/:projectId/content-agent/:contentBriefId/reject', blockViewOnly, workspaceController.rejectContentBriefs);
router.get('/projects/:projectId/content-agent/history', workspaceController.getContentAgentExecutionHistory);

// Keywords
router.get('/keywords', workspaceController.getKeywords);

// Strategies
router.get('/strategies', workspaceController.getStrategies);
router.post('/projects/:projectId/generate-strategy', blockViewOnly, workspaceController.generateStrategy);
router.put('/projects/:projectId/strategies/:strategyId/approve', blockViewOnly, workspaceController.approveStrategy);
router.put('/projects/:projectId/strategies/:strategyId/reject', blockViewOnly, workspaceController.rejectStrategy);
router.post('/projects/:projectId/strategies/:strategyId/publish', blockViewOnly, workspaceController.publishStrategy);

// Analytics
router.get('/projects/:projectId/analytics', workspaceController.getAnalytics);

// Tasks (Approvals Queue)
router.get('/projects/:projectId/tasks', workspaceController.getTasks);
router.put('/projects/:projectId/tasks/:taskId/status', blockViewOnly, workspaceController.updateTaskStatus);

// Reports
router.get('/projects/:projectId/reports', workspaceController.getReports);
router.post('/projects/:projectId/generate-report', blockViewOnly, workspaceController.generateReport);

// Dashboard & Search
router.get('/dashboard', workspaceController.getDashboard);
router.get('/search', workspaceController.globalSearch);

// Comments (polymorphic: targetType is 'Strategy' | 'Task' | 'Report')
router.get('/:targetType/:targetId/comments', workspaceController.getComments);
router.post('/:targetType/:targetId/comments', blockViewOnly, workspaceController.createComment);
router.delete('/comments/:commentId', workspaceController.deleteComment);

// Attachments (polymorphic, same targetType set as comments)
router.get('/:targetType/:targetId/attachments', workspaceController.getAttachments);
router.post('/:targetType/:targetId/attachments', blockViewOnly, uploadAttachment, workspaceController.createAttachment);
router.delete('/attachments/:attachmentId', workspaceController.deleteAttachment);

// History (audit log). /projects/:projectId/history is registered BEFORE the
// generic /:targetType/:targetId/history route so it matches first — Express
// picks the first matching route in registration order, and both are 3-segment
// paths ending the same way, so order here is load-bearing, not cosmetic.
// (Note: Express 5's router no longer supports inline regex param constraints
// like `:targetType(Strategy|Task|Report)`, so targetType is validated inside
// the controller instead.)
router.get('/projects/:projectId/history', workspaceController.getHistory);
router.get('/:targetType/:targetId/history', workspaceController.getHistory);

module.exports = router;