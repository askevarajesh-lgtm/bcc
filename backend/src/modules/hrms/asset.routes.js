const express = require('express');
const router = express.Router();
const assetController = require('./asset.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(assetController.getAssets)
  .post(assetController.createAsset);

router
  .route('/:id/assign')
  .put(assetController.assignAsset);

router
  .route('/:id/return')
  .put(assetController.returnAsset);

module.exports = router;
