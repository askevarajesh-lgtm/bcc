const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public Form Submissions (no auth header required)
router.post('/:id/submit', formController.submitForm);

// Authenticated Form Settings & Submissions Audit
router.use(authMiddleware);

router.get('/', formController.getForms);
router.post('/', formController.createForm);
router.get('/submissions', formController.getSubmissions);
router.get('/analytics', formController.getFormAnalytics);
router.get('/:id', formController.getFormDetails);
router.put('/:id', formController.updateForm);
router.delete('/:id', formController.deleteForm);

module.exports = router;
