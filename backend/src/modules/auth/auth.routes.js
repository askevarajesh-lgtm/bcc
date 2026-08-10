const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

const authMiddleware = require('../../middlewares/authMiddleware');

router.post('/signin', authController.signin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
router.get('/theme', authController.getGlobalTheme);
router.get('/me', authMiddleware, authController.me);
router.post('/impersonate/:userId', authMiddleware, authController.impersonate);

module.exports = router;
