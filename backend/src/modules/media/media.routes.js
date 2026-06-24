const express = require('express');
const router = express.Router();
const mediaController = require('./media.controller');
const authMiddleware = require('../../middlewares/authMiddleware');
const upload = require('../../middlewares/upload'); // General multer instance

router.use(authMiddleware);

router.post('/upload', upload.single('file'), mediaController.uploadMedia);
router.get('/', mediaController.getWorkspaceMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
