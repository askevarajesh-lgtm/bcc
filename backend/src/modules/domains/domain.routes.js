const express = require('express');
const router = express.Router();
const domainController = require('./domain.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', domainController.getDomains);
router.post('/', domainController.connectDomain);
router.get('/:id', domainController.getDomainDetails);
router.post('/:id/verify', domainController.verifyDNS);
router.delete('/:id', domainController.disconnectDomain);

module.exports = router;
