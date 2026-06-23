const express = require('express');
const router = express.Router();
const templateController = require('./template.controller');
const zipUpload = require('../../middlewares/zipUpload');
const authMiddleware = require('../../middlewares/authMiddleware');

// Get templates based on type query
router.get('/', templateController.getTemplates);

// Upload a new template zip
router.post('/upload', authMiddleware, zipUpload.single('file'), templateController.uploadTemplate);

module.exports = router;
