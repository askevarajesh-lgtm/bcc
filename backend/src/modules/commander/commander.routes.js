const express = require('express');
const router = express.Router();
const commanderController = require('./commander.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/command-center')
  .get(commanderController.getCommandCenterData);

module.exports = router;
