const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(invoiceController.getInvoices);

router.route('/:id')
  .get(invoiceController.getInvoice);

router.post('/:id/payment', invoiceController.updatePayment);
router.get('/:id/pdf', invoiceController.generatePDF);

module.exports = router;
