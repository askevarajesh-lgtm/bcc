/**
 * Technical SEO Routes (v1)
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/technicalSeo.controller');

// Mock Auth Middleware
const requireAuth = (req, res, next) => {
  req.user = req.user || { _id: 'mock-user', workspaceId: 'mock-workspace' };
  next();
};

// Start a new audit
router.post('/audit', requireAuth, controller.startAudit);

// Get audit status/summary
router.get('/audit/:id', requireAuth, controller.getAudit);

// Get dashboard aggregates
router.get('/dashboard', requireAuth, controller.getDashboard);

module.exports = router;
