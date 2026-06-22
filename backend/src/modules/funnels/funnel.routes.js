const express = require('express');
const router = express.Router();
const funnelController = require('./funnel.controller');
const { validateCreateFunnel, validateAddStep } = require('./funnel.validation');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Funnel CRUD
router.get('/', funnelController.getFunnels);
router.get('/:id', funnelController.getFunnelDetails);
router.post('/', validateCreateFunnel, funnelController.createFunnel);
router.put('/:id', funnelController.updateFunnel);
router.delete('/:id', funnelController.deleteFunnel);

// Publish / Unpublish
router.post('/:id/publish', funnelController.publishFunnel);
router.post('/:id/unpublish', funnelController.unpublishFunnel);

// Steps
router.get('/:id/steps', funnelController.getSteps);
router.post('/:id/steps', validateAddStep, funnelController.addStep);

// Analytics
router.get('/:id/analytics', funnelController.getAnalytics);

module.exports = router;
