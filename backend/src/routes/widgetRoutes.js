const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widgetController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', widgetController.getWidgets);
router.post('/', widgetController.createWidget);
router.get('/:id', widgetController.getWidgetDetails);
router.put('/:id', widgetController.updateWidget);
router.delete('/:id', widgetController.deleteWidget);

module.exports = router;
