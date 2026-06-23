const express = require('express');
const router = express.Router();
const storeController = require('./store.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Store CRUD
router.get('/', storeController.getStores);
router.post('/', storeController.createStore);
router.get('/:id', storeController.getStoreDetails);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

// Store Stats
router.get('/:id/stats', storeController.getStoreStats);

// Sub-Tab configurations
router.put('/:storeId/policies', storeController.updatePolicies);
router.put('/:storeId/payments', storeController.updatePayments);
router.put('/:storeId/email-sender', storeController.updateEmailSender);

// Products Nested CRUD
router.get('/:storeId/products', storeController.getProducts);
router.post('/:storeId/products', storeController.addProduct);
router.put('/:storeId/products/:productId', storeController.updateProduct);
router.delete('/:storeId/products/:productId', storeController.deleteProduct);

// Collections Nested CRUD
router.get('/:storeId/collections', storeController.getCollections);
router.post('/:storeId/collections', storeController.addCollection);
router.put('/:storeId/collections/:collectionId', storeController.updateCollection);
router.delete('/:storeId/collections/:collectionId', storeController.deleteCollection);

// Discounts Nested CRUD
router.get('/:storeId/discounts', storeController.getDiscounts);
router.post('/:storeId/discounts', storeController.addDiscount);
router.put('/:storeId/discounts/:discountId', storeController.updateDiscount);
router.delete('/:storeId/discounts/:discountId', storeController.deleteDiscount);

// Store Pages Nested CRUD
router.get('/:storeId/pages', storeController.getStorePages);
router.post('/:storeId/pages', storeController.addStorePage);
router.put('/:storeId/pages/:pageId/status', storeController.updateStorePageStatus);
router.delete('/:storeId/pages/:pageId', storeController.deleteStorePage);

// Orders & Fulfillments
router.get('/:storeId/orders', storeController.getOrders);
router.put('/:storeId/orders/:orderId/fulfill', storeController.fulfillOrder);

// Customers list
router.get('/:storeId/customers', storeController.getCustomers);

module.exports = router;
