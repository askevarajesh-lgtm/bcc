const express = require('express');
const router = express.Router();
const ecommerceController = require('./ecommerce.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const mongoose = require('mongoose');
const Website = require('../websites/website.model');

router.use(authMiddleware);

// Middleware to verify website ownership
const verifyWebsiteOwnership = async (req, res, next) => {
  try {
    // Some routes might not have websiteId if they are global (none currently, but just in case)
    if (!req.params.websiteId) return next();
    
    if (!req.workspaceId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing workspaceId' });
    }

    const website = await Website.findOne({ _id: req.params.websiteId, workspaceId: req.workspaceId });
    
    if (!website) {
      return res.status(403).json({ success: false, message: 'Forbidden: Website not found or does not belong to your workspace' });
    }
    
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error verifying website ownership' });
  }
};

router.use('/:websiteId', verifyWebsiteOwnership);
// All routes require websiteId to enforce isolation
router.get('/:websiteId/products', ecommerceController.getProducts);
router.post('/:websiteId/products', ecommerceController.createProduct);
router.put('/:websiteId/products/:productId', ecommerceController.updateProduct);
router.delete('/:websiteId/products/:productId', ecommerceController.deleteProduct);

router.get('/:websiteId/settings', ecommerceController.getSettings);
router.put('/:websiteId/settings', ecommerceController.updateSettings);

router.get('/:websiteId/orders', ecommerceController.getOrders);
router.get('/:websiteId/customers', ecommerceController.getCustomers);
router.get('/:websiteId/payments', ecommerceController.getPayments);
router.get('/:websiteId/shipping', ecommerceController.getShipping);

router.post('/:websiteId/checkout', ecommerceController.checkout);

module.exports = router;
