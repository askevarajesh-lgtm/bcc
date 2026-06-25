const express = require('express');
const router = express.Router();
const masterItemController = require('./masterItem.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .post(masterItemController.createMasterItem)
  .get(masterItemController.getMasterItems);

router.route('/:id')
  .get(masterItemController.getMasterItem)
  .put(masterItemController.updateMasterItem)
  .delete(masterItemController.deleteMasterItem);

module.exports = router;
