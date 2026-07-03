const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/stats')
  .get(analyticsController.getDashboardStats);

module.exports = router;
