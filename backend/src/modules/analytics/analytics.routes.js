const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const protect = require('../../middlewares/authMiddleware'); // Existing auth middleware

router.use(protect); // Ensure all routes are protected

// GET Analytics dashboard data
router.get('/', analyticsController.getAnalytics);

module.exports = router;