const express = require('express');
const router = express.Router();
const semrushController = require('./semrush.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Project Routes
router.get('/projects', semrushController.getProjects);
router.post('/projects', semrushController.createProject);
router.get('/projects/:id', semrushController.getProjectById);
router.put('/projects/:id', semrushController.updateProject);
router.post('/projects/:id/refresh', semrushController.refreshProject);
router.delete('/projects/:id', semrushController.deleteProject);

// Position Tracking
router.post('/projects/:id/tracking-config', semrushController.configureTracking);
router.get('/projects/:id/position-tracking', semrushController.getPositionTracking);

// Interactive tools
router.get('/projects/:id/traffic-analytics', semrushController.getTrafficAnalytics);
router.get('/projects/:id/keyword-magic-tool', semrushController.getKeywordMagicTool);

// Snapshots
router.get('/projects/:id/snapshots', semrushController.getHistoricalSnapshots);
router.get('/projects/:id/snapshots/latest', semrushController.getLatestSnapshot);

module.exports = router;
