const express = require('express');
const router = express.Router();
const semrushController = require('./semrush.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Project Routes
router.get('/projects', semrushController.getProjects);
router.post('/projects', semrushController.createProject);
router.get('/projects/:id', semrushController.getProjectById);
router.post('/projects/:id/refresh', semrushController.refreshProject);
router.delete('/projects/:id', semrushController.deleteProject);

// Position Tracking
router.post('/projects/:id/tracking-config', semrushController.configureTracking);
router.get('/projects/:id/position-tracking', semrushController.getPositionTracking);

// Legacy Live Routes
router.get('/domain-overview', semrushController.getDomainOverview);
router.get('/keyword-research', semrushController.getKeywordResearch);
router.get('/backlinks', semrushController.getBacklinksOverview);
router.get('/site-health', semrushController.getSiteHealth);
router.get('/domain-keywords-drilldown', semrushController.getDomainKeywordsDrilldown);

module.exports = router;
