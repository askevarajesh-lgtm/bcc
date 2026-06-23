const express = require('express');
const router = express.Router();
const websiteController = require('./website.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

// Website CRUD
router.get('/', websiteController.getWebsites);
router.post('/', websiteController.createWebsite);
router.get('/:id', websiteController.getWebsiteDetails);
router.put('/:id', websiteController.updateWebsite);
router.delete('/:id', websiteController.deleteWebsite);
router.post('/:id/clone', websiteController.cloneWebsite);

// Page actions
router.get('/:websiteId/pages/:pageId', websiteController.getPage);
router.post('/:id/pages', websiteController.addPage);
router.post('/:websiteId/pages/:pageId/duplicate', websiteController.duplicatePage);
router.put('/:websiteId/pages/:pageId', websiteController.updatePage);
router.delete('/:websiteId/pages/:pageId', websiteController.deletePage);

module.exports = router;
