const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const authMiddleware = require('../../middlewares/authMiddleware'); // assuming it exists

router.use(authMiddleware);

router.get('/assignable-users', supportController.getAssignableUsers);
router.post('/', supportController.createSupportTicket);

module.exports = router;
