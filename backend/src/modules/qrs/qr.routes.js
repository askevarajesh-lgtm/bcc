const express = require('express');
const router = express.Router();
const qrController = require('./qr.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// Public Scan Redirection Path (mounted at app level)
router.get('/scan/:slug', qrController.redirectScan);

// Authenticated QR Code administration CRUD
router.use(authMiddleware);

router.get('/', qrController.getQRs);
router.post('/', qrController.createQR);
router.get('/:id', qrController.getQRDetails);
router.delete('/:id', qrController.deleteQR);

module.exports = router;
