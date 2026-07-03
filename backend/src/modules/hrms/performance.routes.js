const express = require('express');
const router = express.Router();
const performanceController = require('./performance.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(performanceController.getPerformances)
  .post(performanceController.createPerformanceReview);

router
  .route('/:id')
  .put(performanceController.updatePerformanceReview);

module.exports = router;
