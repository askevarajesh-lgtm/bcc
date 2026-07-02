const express = require('express');
const router = express.Router();
const strategyController = require('./strategy.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// Protect all routes with auth
router.use(authMiddleware);

// Allowed roles based on user request sidebar access
// Agency Manager, Agency Admin, Brand Admin, Commander Admin
router.use(requireRole(['supreme_super_admin', 'superadmin', 'commander_admin', 'agency_admin', 'agency_manager', 'brand_admin']));

// Get current strategy
router.get('/', strategyController.getStrategy);

// Trigger a new strategy generation
router.post('/generate', strategyController.generateStrategy);

// Add new objective
router.post('/objectives', strategyController.addObjective);

// Add new initiative
router.post('/initiatives', strategyController.addInitiative);

module.exports = router;
