const express = require('express');
const router = express.Router();
const agencyPackageController = require('./agencyPackage.controller');

router.route('/')
  .get(agencyPackageController.getPackages)
  .post(agencyPackageController.createPackage);

router.route('/:id')
  .get(agencyPackageController.getPackage)
  .put(agencyPackageController.updatePackage)
  .delete(agencyPackageController.deletePackage);

module.exports = router;
