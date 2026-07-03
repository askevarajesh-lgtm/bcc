const express = require('express');
const router = express.Router();
const payrollController = require('./payroll.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(payrollController.getPayrolls)
  .post(payrollController.generatePayroll);

router
  .route('/:id/status')
  .put(payrollController.updatePayrollStatus);

module.exports = router;
