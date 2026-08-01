const express = require('express');
const router = express.Router({ mergeParams: true });
const monitoringController = require('../controllers/monitoring.controller');
const { verifyToken } = require('../../../middlewares/rbac.middleware');

router.use(verifyToken);

const VIEW_ONLY_ROLES = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'];
const blockViewOnly = (req, res, next) => {
  if (VIEW_ONLY_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden. Your role has read-only access.' });
  }
  next();
};

// All routes are implicitly prefixed with /projects/:projectId/monitoring if mounted properly
// Or, if mounted at /api/seo/workspace/v1/, the :projectId comes from the path

router.get('/dashboard', monitoringController.getDashboardOverview);
router.post('/scan', blockViewOnly, monitoringController.triggerScan);
router.get('/scan/:scanId/status', monitoringController.getScanStatus);

router.get('/alerts', monitoringController.getAlerts);
router.put('/alerts/:alertId/status', blockViewOnly, monitoringController.updateAlertStatus);

router.get('/history', monitoringController.getHistory);

router.get('/settings', monitoringController.getSettings);
router.put('/settings', blockViewOnly, monitoringController.updateSettings);

module.exports = router;
