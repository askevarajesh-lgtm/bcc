const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/signin', authController.signin);

module.exports = router;
