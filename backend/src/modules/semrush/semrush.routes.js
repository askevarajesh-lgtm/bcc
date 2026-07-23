const express = require('express');
const router = express.Router();
const semrushController = require('./semrush.controller');

// Optionally, you might want to add authentication middleware here if it's required for all routes
// const { protect } = require('../../middlewares/auth.middleware');
// router.use(protect);

router.get('/domain-overview', semrushController.getDomainOverview);
router.get('/keyword-research', semrushController.getKeywordResearch);
router.get('/backlinks', semrushController.getBacklinksOverview);
router.get('/site-health', semrushController.getSiteHealth);

module.exports = router;
