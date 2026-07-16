const express = require('express');
const router = express.Router();
const directClientPackageController = require('./directClientPackage.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// All direct client package routes should be protected
router.use(authMiddleware);

router.route('/')
  .get(directClientPackageController.getPackages)
  .post(directClientPackageController.createPackage);

router.route('/:id')
  .put(directClientPackageController.updatePackage)
  .delete(directClientPackageController.deletePackage);

module.exports = router;
