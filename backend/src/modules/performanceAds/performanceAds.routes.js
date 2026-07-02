const express = require('express');
const router = express.Router();
const performanceAdsController = require('./performanceAds.controller');
const protect = require('../../middlewares/authMiddleware'); // Existing auth middleware

router.use(protect); // Ensure all routes are protected

// GET Dashboard data
router.get('/dashboard', performanceAdsController.getDashboard);

// POST /api/performance-ads/sync
router.post('/sync', protect, performanceAdsController.syncData);

// POST /api/performance-ads/campaign
router.post('/campaign', protect, performanceAdsController.addCampaign);

module.exports = router;
