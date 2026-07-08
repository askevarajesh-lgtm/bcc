const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');

const studioController = require('./studio.controller');
const itemController = require('./item.controller');
const calendarController = require('./calendar.controller');
const trendController = require('./trend.controller');
const syncController = require('./sync.controller');
const exportController = require('./export.controller');

router.use(authMiddleware);

// Studio routes
router.post('/studio/generate', studioController.generate);
router.post('/studio/regenerate', studioController.regenerate);
router.get('/integrations/status', studioController.integrationStatus);

// Item routes
router.get('/items', itemController.getItems);
router.get('/items/:id', itemController.getItem);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);
router.post('/items/:id/approve', itemController.approveItem);

// Export routes
router.get('/export', exportController.exportApprovedItems);

// Sync routes (manual bridges)
router.post('/items/:id/sync/seo', syncController.syncSeo);
router.post('/items/:id/sync/blog', syncController.syncBlog);
router.post('/items/:id/sync/publish', syncController.syncPublish);

// Calendar routes
router.get('/calendar', calendarController.getCalendar);
router.post('/calendar/:itemId/schedule', calendarController.scheduleItem);

// Trend routes
router.get('/trends', trendController.getTrends);
router.post('/trends/refresh', trendController.refreshTrends);
router.post('/trends/:id/save-idea', trendController.saveIdea);

module.exports = router;
