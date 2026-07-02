const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const slaController = require('./sla.controller');

// All SLA routes require authentication
router.use(authMiddleware);

router.post('/', slaController.createSla);
router.get('/dashboard-stats', slaController.getSlaDashboardStats);
router.get('/', slaController.getSlas);
router.get('/:id', slaController.getSlaById);
router.put('/:id', slaController.updateSla);
router.post('/:id/notes', slaController.addSlaNote);
router.post('/:id/escalate', slaController.escalateSla);

module.exports = router;
