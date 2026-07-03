const express = require('express');
const { body } = require('express-validator');
const calendarController = require('./calendar.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Validation rules for creating a custom event
const createEventValidation = [
  body('title').notEmpty().withMessage('Event title is required').trim(),
  body('eventType').notEmpty().withMessage('Event type is required'),
  body('startDateTime').notEmpty().withMessage('Start date/time is required'),
  body('endDateTime').notEmpty().withMessage('End date/time is required'),
];

// Specific routes first
router.get('/analytics', calendarController.getCalendarAnalytics);

// CRUD routes
router.get('/', calendarController.getAllEvents);
router.post('/', createEventValidation, calendarController.createEvent);
router.get('/:id', calendarController.getEventById);
router.put('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);

// Status and detail attachment routes
router.put('/:id/status', calendarController.updateEventStatus);
router.post('/:id/notes', calendarController.addEventNote);
router.post('/:id/attachments', calendarController.addEventAttachment);

module.exports = router;
