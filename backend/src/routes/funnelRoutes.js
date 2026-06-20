const express = require('express');
const router = express.Router();
const funnelController = require('../controllers/funnelController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Funnel CRUD
router.get('/', funnelController.getFunnels);
router.post('/', funnelController.createFunnel);
router.get('/:id', funnelController.getFunnelDetails);
router.put('/:id', funnelController.updateFunnel);
router.delete('/:id', funnelController.deleteFunnel);

// Funnel step actions
router.post('/:id/steps', funnelController.addStep);
router.delete('/:funnelId/steps/:stepId', funnelController.deleteStep);

module.exports = router;
