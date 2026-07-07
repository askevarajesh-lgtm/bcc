const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/signin', authController.signin);
router.post('/impersonate/:userId', authMiddleware, authController.impersonate);

module.exports = router;
