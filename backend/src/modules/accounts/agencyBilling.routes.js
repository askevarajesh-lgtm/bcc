const express = require('express');
const router = express.Router();
const agencyBillingController = require('./agencyBilling.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/', authMiddleware, agencyBillingController.getBillingData);
router.post('/:id/action', authMiddleware, agencyBillingController.triggerBillingAction);

module.exports = router;
