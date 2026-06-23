const express = require('express');
const router = express.Router();
const agencyController = require('./agency.controller');

router.route('/')
  .get(agencyController.getAgencies)
  .post(agencyController.createAgency);

router.route('/:id')
  .get(agencyController.getAgency)
  .put(agencyController.updateAgency)
  .delete(agencyController.deleteAgency);

module.exports = router;
