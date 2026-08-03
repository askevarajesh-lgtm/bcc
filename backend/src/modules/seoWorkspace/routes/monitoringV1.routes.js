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

// Overview & Scans
router.get('/dashboard', monitoringController.getDashboardOverview);
router.post('/scan', blockViewOnly, monitoringController.triggerScan);
router.get('/scan/:scanId/status', monitoringController.getScanStatus);

// Alerts & Recommendations
router.get('/alerts', monitoringController.getAlerts);
router.put('/alerts/:alertId/status', blockViewOnly, monitoringController.updateAlertStatus);

// History & Intelligence
router.get('/history', monitoringController.getHistory);
router.get('/health-breakdown', monitoringController.getHealthBreakdown);
router.get('/risk-assessment', monitoringController.getRiskAssessment);
router.get('/opportunities', monitoringController.getOpportunities);
router.get('/monitors', monitoringController.listMonitors);

// Settings
router.get('/settings', monitoringController.getSettings);
router.put('/settings', blockViewOnly, monitoringController.updateSettings);

module.exports = router;
