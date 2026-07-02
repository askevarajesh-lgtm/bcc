const express = require('express');
const router = express.Router();
const superadminController = require('./superadmin.controller');

router.route('/dashboard-stats')
  .get(superadminController.getDashboardStats);

router.route('/command-center')
  .get(superadminController.getCommandCenterData);

module.exports = router;
