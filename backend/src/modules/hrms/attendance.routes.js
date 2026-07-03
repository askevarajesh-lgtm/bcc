const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(attendanceController.getAttendances);

router
  .route('/clock-in')
  .post(attendanceController.clockIn);

router
  .route('/clock-out')
  .post(attendanceController.clockOut);

module.exports = router;
