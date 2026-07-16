const express = require('express');
const router = express.Router();
const agencyReportsController = require('./agencyReports.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/', authMiddleware, agencyReportsController.getReports);
router.post('/', authMiddleware, agencyReportsController.createReport);
router.put('/:id', authMiddleware, agencyReportsController.updateReport);
router.delete('/:id', authMiddleware, agencyReportsController.deleteReport);
router.post('/:id/action', authMiddleware, agencyReportsController.triggerAction);

module.exports = router;
