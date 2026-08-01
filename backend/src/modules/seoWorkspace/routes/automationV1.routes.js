const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationV1.controller');
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

// Execution
router.post('/projects/:projectId/workflows/:id/run', automationController.runWorkflow);
router.post('/projects/:projectId/workflows/:id/simulate', automationController.simulateWorkflow);
router.post('/projects/:projectId/workflows/:id/cancel', automationController.cancelExecution);

// History & Logs & Metrics
router.get('/projects/:projectId/history', automationController.getHistory);
router.get('/projects/:projectId/history/:runId/logs', automationController.getLogs);
router.get('/projects/:projectId/metrics', automationController.getMetrics);
router.get('/projects/:projectId/queue', automationController.getQueueStatus);

// Validation & Templates
router.post('/projects/:projectId/validate', automationController.validateWorkflow);
router.get('/templates', automationController.listTemplates);

module.exports = router;
