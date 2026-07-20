const express = require('express');
const router = express.Router();
const mosController = require('./mos.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// Protect all routes and restrict to agency admin/manager
router.use(authMiddleware);
router.use(requireRole(['agency_super_admin', 'agency_manager', 'supreme_super_admin', 'commander_admin']));

router.get('/dashboard', mosController.getMosDashboard);
router.put('/config', mosController.updateMosConfig);
router.post('/recalculate', mosController.triggerRecalculation);
router.post('/action-plan', mosController.generateActionPlan);

module.exports = router;
