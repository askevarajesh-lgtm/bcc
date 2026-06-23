const express = require('express');
const router = express.Router();
const integrationController = require('./integration.controller');

router.route('/')
  .get(integrationController.getIntegrations)
  .post(integrationController.createIntegration);

router.route('/:id')
  .get(integrationController.getIntegration)
  .put(integrationController.updateIntegration)
  .delete(integrationController.deleteIntegration);

module.exports = router;
