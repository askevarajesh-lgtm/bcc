const express = require('express');
const router = express.Router();
const roleController = require('./role.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(roleController.getRoles)
  .post(roleController.createRole);

router.route('/:id')
  .put(roleController.updateRole)
  .delete(roleController.deleteRole);

module.exports = router;
