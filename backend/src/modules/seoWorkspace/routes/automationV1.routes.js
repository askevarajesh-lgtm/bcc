const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationV1.controller');
const secretVaultController = require('../controllers/secretVault.controller');
const schedulerController = require('../controllers/scheduler.controller');
const notificationCenterController = require('../controllers/notificationCenter.controller');
const analyticsController = require('../controllers/automationAnalytics.controller');
const authMiddleware = require('../../../middlewares/authMiddleware');

router.use(authMiddleware);

// CRUD & Lifecycle
router.post('/projects/:projectId/workflows', automationController.createWorkflow);
router.get('/projects/:projectId/workflows', automationController.listWorkflows);
router.get('/projects/:projectId/workflows/:id', automationController.getWorkflow);
router.put('/projects/:projectId/workflows/:id', automationController.updateWorkflow);
router.delete('/projects/:projectId/workflows/:id', automationController.deleteWorkflow);

router.post('/projects/:projectId/workflows/:id/clone', automationController.cloneWorkflow);
router.post('/projects/:projectId/workflows/:id/export', automationController.exportWorkflow);
router.post('/projects/:projectId/workflows/import', automationController.importWorkflow);
router.post('/projects/:projectId/workflows/:id/rollback', automationController.rollbackWorkflow);
router.post('/projects/:projectId/workflows/:id/publish', automationController.publishWorkflow);
router.post('/projects/:projectId/workflows/:id/archive', automationController.archiveWorkflow);

// Execution & Simulation
router.post('/projects/:projectId/workflows/:id/run', automationController.runWorkflow);
router.post('/projects/:projectId/workflows/:id/simulate', automationController.simulateWorkflow);
router.post('/projects/:projectId/workflows/:id/cancel', automationController.cancelExecution);

// History & Logs & Metrics
router.get('/projects/:projectId/history', automationController.getHistory);
router.get('/projects/:projectId/history/:runId/logs', automationController.getLogs);
router.get('/projects/:projectId/metrics', automationController.getMetrics);
router.get('/projects/:projectId/queue', automationController.getQueueStatus);
router.post('/projects/:projectId/queue/dlq/replay', automationController.replayDlq);

// AI Generator & Optimizer
router.post('/projects/:projectId/ai/generate', automationController.generateAiWorkflow);
router.post('/projects/:projectId/ai/optimize', automationController.optimizeAiWorkflow);

// Registries & Templates
router.get('/projects/:projectId/triggers', automationController.listTriggers);
router.get('/projects/:projectId/actions', automationController.listActions);
router.post('/projects/:projectId/validate', automationController.validateWorkflow);
router.get('/templates', automationController.listTemplates);

// Secret & Credential Vault
router.get('/projects/:projectId/credentials', secretVaultController.list);
router.post('/projects/:projectId/credentials', secretVaultController.store);
router.delete('/projects/:projectId/credentials/:credentialId', secretVaultController.delete);
router.post('/projects/:projectId/credentials/:credentialId/verify', secretVaultController.verify);

// Calendar & Timezone Scheduler
router.get('/projects/:projectId/schedules', schedulerController.list);
router.post('/projects/:projectId/schedules', schedulerController.save);
router.post('/projects/:projectId/schedules/:scheduleId/toggle', schedulerController.toggle);
router.post('/projects/:projectId/schedules/:scheduleId/trigger-now', schedulerController.triggerNow);
router.delete('/projects/:projectId/schedules/:scheduleId', schedulerController.delete);

// Notification Hub & Digests
router.get('/projects/:projectId/notifications', notificationCenterController.list);
router.post('/projects/:projectId/notifications/:notificationId/read', notificationCenterController.markAsRead);
router.post('/projects/:projectId/notifications/read-all', notificationCenterController.markAllAsRead);
router.delete('/projects/:projectId/notifications/:notificationId', notificationCenterController.delete);
router.post('/projects/:projectId/notifications/digest', notificationCenterController.generateDigest);

// Analytics & Insights
router.get('/projects/:projectId/analytics/overview', analyticsController.getOverview);

module.exports = router;
