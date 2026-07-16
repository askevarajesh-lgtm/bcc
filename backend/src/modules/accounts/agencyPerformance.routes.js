const express = require('express');
const router = express.Router();
const agencyPerformanceController = require('./agencyPerformance.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/', authMiddleware, agencyPerformanceController.getAgencyPerformance);

module.exports = router;
