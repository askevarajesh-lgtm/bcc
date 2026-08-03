const express = require('express');
const router = express.Router();
const clientOverviewController = require('./clientOverview.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Endpoint for client dashboard overview stats
router.get('/', clientOverviewController.getClientOverviewData);

module.exports = router;
