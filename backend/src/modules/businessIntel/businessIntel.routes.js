const express = require('express');
const router = express.Router();
const businessIntelController = require('./businessIntel.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/dashboard', businessIntelController.getDashboardData);

module.exports = router;
