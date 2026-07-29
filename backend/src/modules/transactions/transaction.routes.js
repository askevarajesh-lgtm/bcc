const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const protect = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/upload');

// Public Webhook route (No auth)
router.post('/webhook/razorpay', transactionController.razorpayWebhook);

// Protected routes
router.use(protect);

router.post('/manual', upload.single('screenshot'), transactionController.createManualTransaction);
router.get('/', transactionController.getTransactions);
router.put('/:id/verify', transactionController.verifyTransaction);

module.exports = router;
