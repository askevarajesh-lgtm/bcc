const express = require('express');
const router = express.Router();
const workspaceController = require('./seoWorkspace.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Projects
router.route('/projects')
  .get(workspaceController.getProjects)
  .post(workspaceController.createProject);

router.put('/projects/:projectId/settings', workspaceController.updateSettings);

// Audits
router.get('/audits', workspaceController.getAudits);
router.post('/projects/:projectId/audit', workspaceController.runAudit);

// Keywords
router.get('/keywords', workspaceController.getKeywords);

// Strategies
router.get('/strategies', workspaceController.getStrategies);
router.post('/projects/:projectId/generate-strategy', workspaceController.generateStrategy);
router.post('/projects/:projectId/strategies/:strategyId/publish', workspaceController.publishStrategy);

// Analytics
router.get('/projects/:projectId/analytics', workspaceController.getAnalytics);

// Tasks (Approvals Queue)
router.get('/projects/:projectId/tasks', workspaceController.getTasks);
router.put('/projects/:projectId/tasks/:taskId/status', workspaceController.updateTaskStatus);

// Reports
router.get('/projects/:projectId/reports', workspaceController.getReports);
router.post('/projects/:projectId/generate-report', workspaceController.generateReport);

module.exports = router;
