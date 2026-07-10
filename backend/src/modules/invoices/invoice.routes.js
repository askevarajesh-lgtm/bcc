const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .post(invoiceController.createInvoice)
  .get(invoiceController.getInvoices);

router.route('/:id')
  .get(invoiceController.getInvoice)
  .put(invoiceController.updateInvoice)
  .delete(invoiceController.deleteInvoice);

router.post('/:id/payment', invoiceController.updatePayment);
router.post('/:id/send', invoiceController.sendInvoice);
router.get('/:id/pdf', invoiceController.generatePDF);

module.exports = router;
