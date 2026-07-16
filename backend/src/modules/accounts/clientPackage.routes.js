const express = require('express');
const router = express.Router();
const clientPackageController = require('./clientPackage.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/', authMiddleware, clientPackageController.getPackages);
router.post('/', authMiddleware, clientPackageController.createPackage);
router.put('/:id', authMiddleware, clientPackageController.updatePackage);
router.delete('/:id', authMiddleware, clientPackageController.deletePackage);

module.exports = router;
