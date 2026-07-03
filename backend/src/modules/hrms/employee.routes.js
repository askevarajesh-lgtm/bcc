const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(employeeController.getEmployees)
  .post(employeeController.createEmployee);

router
  .route('/:id')
  .get(employeeController.getEmployee)
  .put(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = router;
