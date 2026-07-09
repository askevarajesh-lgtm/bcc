const express = require('express');
const router = express.Router();
const sidebarController = require('./sidebar.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// All sidebar routes should be protected by authMiddleware
router.use(authMiddleware);

router.route('/counts')
  .get(sidebarController.getSidebarCounts);

module.exports = router;
