const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const { getOverviewData } = require('./agencyOverview.controller');

router.use(authMiddleware);

router.get('/', getOverviewData);

module.exports = router;
