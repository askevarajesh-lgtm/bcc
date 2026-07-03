const express = require('express');
const { body } = require('express-validator');
const deliverablesController = require('./deliverables.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Validation rules
const createDeliverableValidation = [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('deliverableType').notEmpty().withMessage('Deliverable type is required'),
  body('clientId').notEmpty().withMessage('Client account is required'),
  body('dueDate').notEmpty().withMessage('Due date is required'),
];

// Specific routes first
router.get('/analytics', deliverablesController.getDeliverableAnalytics);

// CRUD routes
router.get('/', deliverablesController.getAllDeliverables);
router.post('/', createDeliverableValidation, deliverablesController.createDeliverable);
router.get('/:id', deliverablesController.getDeliverableById);
router.put('/:id', deliverablesController.updateDeliverable);
router.delete('/:id', deliverablesController.deleteDeliverable);

// Status, Comment & File Attachments routes
router.put('/:id/submit', deliverablesController.submitForApproval);
router.put('/:id/approve', deliverablesController.approveDeliverable);
router.put('/:id/revision', deliverablesController.requestRevision);
router.post('/:id/files', deliverablesController.uploadDeliverableFile);
router.post('/:id/comments', deliverablesController.addDeliverableComment);

module.exports = router;
