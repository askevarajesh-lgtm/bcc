const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');

router.route('/')
  .get(subscriptionController.getPlans)
  .post(subscriptionController.createPlan);

router.route('/:id')
  .get(subscriptionController.getPlan)
  .put(subscriptionController.updatePlan)
  .delete(subscriptionController.deletePlan);

module.exports = router;
