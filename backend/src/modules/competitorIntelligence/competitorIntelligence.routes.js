const express = require('express');
const router = express.Router();
const controller = require('./competitorIntelligence.controller');
const { verifyToken } = require('../../middlewares/rbac.middleware');

router.use(verifyToken);

// Same view-only role gate as seoWorkspace.routes.js.
const VIEW_ONLY_ROLES = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'];
const blockViewOnly = (req, res, next) => {
  if (VIEW_ONLY_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden. Your role has read-only access to Competitor Intelligence.' });
  }
  next();
};

router.post('/projects/:projectId/compare', blockViewOnly, controller.runComparison);

router.post('/projects/:projectId/recommendations/generate', blockViewOnly, controller.generateRecommendations);
router.get('/projects/:projectId/recommendations', controller.getRecommendations);
router.put('/projects/:projectId/recommendations/dismiss', blockViewOnly, controller.dismissRecommendations);

router.post('/projects/:projectId/tasks/generate', blockViewOnly, controller.generateTasks);

router.get('/projects/:projectId/history', controller.getExecutionHistory);

module.exports = router;
