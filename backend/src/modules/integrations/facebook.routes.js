const express = require('express');
const facebookController = require('./facebook.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

// OAuth routes
router.get('/auth', facebookController.generateAuthUrl);
router.get('/callback', facebookController.handleCallback);

// API routes protected by standard authMiddleware
router.use(authMiddleware);

router.get('/integrations', facebookController.getIntegrations);
router.post('/integrations/subscribe', facebookController.subscribePage);
router.post('/integrations/unsubscribe', facebookController.unsubscribePage);
router.delete('/integrations/:pageId', facebookController.disconnectPage);
router.get('/integrations/:pageId/logs', facebookController.getLogs);
router.post('/integrations/sync-leads', facebookController.syncLeads);

module.exports = router;
