const express = require('express');
const router = express.Router();
const brandController = require('./brand.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// All brand routes should be protected
router.use(authMiddleware);

router.route('/')
  .get(brandController.getBrands)
  .post(brandController.createBrand);

router.route('/:id')
  .put(brandController.updateBrandStatus)
  .delete(brandController.deleteBrand);

module.exports = router;
