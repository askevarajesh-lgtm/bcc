const express = require('express');
const router = express.Router();
const leaveController = require('./leave.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(leaveController.getLeaves)
  .post(leaveController.applyLeave);

router
  .route('/:id/status')
  .put(leaveController.updateLeaveStatus);

module.exports = router;
