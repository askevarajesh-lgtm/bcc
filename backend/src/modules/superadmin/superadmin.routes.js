const express = require('express');
const router = express.Router();
const superadminController = require('./superadmin.controller');

router.route('/dashboard-stats')
  .get(superadminController.getDashboardStats);


module.exports = router;
