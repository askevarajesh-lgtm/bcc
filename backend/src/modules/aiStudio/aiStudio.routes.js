const express = require('express');
const router = express.Router();
const aiStudioController = require('./aiStudio.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/generate/image', aiStudioController.generateImage);
router.post('/generate/video', aiStudioController.generateVideo);

router.get('/assets', aiStudioController.getAssets);
router.post('/assets', aiStudioController.saveAsset);
router.delete('/assets/:id', aiStudioController.deleteAsset);

module.exports = router;
