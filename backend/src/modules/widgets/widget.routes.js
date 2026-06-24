const express = require('express');
const router = express.Router();
const widgetController = require('./widget.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Public Widget Details
router.get('/:id/public', widgetController.getPublicWidgetDetails);

router.use(authMiddleware);

router.get('/', widgetController.getWidgets);
router.post('/', widgetController.createWidget);
router.get('/:id', widgetController.getWidgetDetails);
router.put('/:id', widgetController.updateWidget);
router.delete('/:id', widgetController.deleteWidget);

module.exports = router;
