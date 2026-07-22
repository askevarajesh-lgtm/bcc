const express = require('express');
const router = express.Router();
const marketplaceController = require('./marketplace.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/purchases', marketplaceController.getPurchasedModules);
router.post('/purchase', marketplaceController.initiatePurchase);
router.post('/verify', marketplaceController.verifyPurchase);

module.exports = router;
