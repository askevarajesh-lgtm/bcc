const express = require('express');
const router = express.Router();
const formTemplateController = require('./form-template.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/', authMiddleware, formTemplateController.getTemplates);

module.exports = router;
