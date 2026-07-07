const express = require('express');
const router = express.Router();
const agencyController = require('./agency.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/dashboard-stats', agencyController.getDashboardStats);

router.route('/')
  .get(agencyController.getAgencies)
  .post(agencyController.createAgency);

router.route('/:id')
  .get(agencyController.getAgency)
  .put(agencyController.updateAgency)
  .delete(agencyController.deleteAgency);

module.exports = router;
