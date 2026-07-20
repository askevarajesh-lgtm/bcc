const express = require('express');
const router = express.Router();
const planUpgradeController = require('./planUpgradeRequest.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .post(planUpgradeController.createUpgradeRequest)
  .get(planUpgradeController.getUpgradeRequests);

router.route('/:id/status')
  .put(planUpgradeController.updateUpgradeRequestStatus);

module.exports = router;
