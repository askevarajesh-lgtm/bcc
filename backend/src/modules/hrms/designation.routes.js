const express = require('express');
const router = express.Router();
const designationController = require('./designation.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(designationController.getDesignations)
  .post(designationController.createDesignation);

router
  .route('/:id')
  .put(designationController.updateDesignation)
  .delete(designationController.deleteDesignation);

module.exports = router;
