const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const protect = require('../../middlewares/authMiddleware');

router.use(protect);

router.get('/history', reportController.getRecentSentReports);
router.get('/analytics', reportController.getAnalytics);
router.post('/generate', reportController.generateReport);

router.get('/schedules', reportController.getSchedules);
router.post('/schedules', reportController.createSchedule);
router.put('/schedules/:id/status', reportController.updateScheduleStatus);
router.delete('/schedules/:id', reportController.deleteSchedule);

module.exports = router;
