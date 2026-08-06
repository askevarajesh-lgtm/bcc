const express = require('express');
const router = express.Router();
const superadminController = require('./superadmin.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.route('/dashboard-stats')
  .get(authMiddleware, superadminController.getDashboardStats);

router.route('/profile')
  .get(authMiddleware, superadminController.getProfile)
  .put(authMiddleware, superadminController.updateProfile);

router.route('/password')
  .put(authMiddleware, superadminController.changePassword);

router.route('/platform-config')
  .get(superadminController.getPlatformConfig);

module.exports = router;
