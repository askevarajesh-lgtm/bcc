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

// Projects
router.route('/projects')
  .get(workspaceController.getProjects)
  .post(blockViewOnly, workspaceController.createProject);

router.put('/projects/:projectId/settings', blockViewOnly, workspaceController.updateSettings);

// Audits
router.get('/audits', workspaceController.getAudits);
router.post('/projects/:projectId/audit', blockViewOnly, workspaceController.runAudit);

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