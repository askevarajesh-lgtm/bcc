const express = require('express');
const router = express.Router();
const resourcesController = require('./resources.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/dashboard', resourcesController.getDashboardData);

module.exports = router;
