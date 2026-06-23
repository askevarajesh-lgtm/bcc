const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(departmentController.getDepartments)
  .post(departmentController.createDepartment);

router.route('/:id')
  .put(departmentController.updateDepartment)
  .delete(departmentController.deleteDepartment);

module.exports = router;
