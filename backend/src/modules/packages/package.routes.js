const express = require('express');
const router = express.Router();
const packageController = require('./package.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// client/directClient package scoping requires req.user, so auth applies to the whole
// unified route. (The old /agency-packages route had no auth middleware; the frontend
// already sends a Bearer token on every request via services/api.js, so this closes a
// pre-existing gap without any frontend changes.)
router.use(authMiddleware);

router.route('/')
  .get(packageController.getPackages)
  .post(packageController.createPackage);

router.route('/:id')
  .get(packageController.getPackage)
  .put(packageController.updatePackage)
  .delete(packageController.deletePackage);

module.exports = router;
