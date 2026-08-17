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

// Legacy live routes removed to enforce background job fetching

module.exports = router;
