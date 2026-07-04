const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const seoController = require('./seoIntelligence.controller');

// All SEO module routes require authentication
router.use(authMiddleware);

// ─── Integration & Dashboard ───────────────────────────────────────────────
router.get('/integration-test', seoController.testIntegration);
router.get('/dashboard-stats',  seoController.getDashboardStats);
router.get('/credit-usage',     seoController.getApiCreditUsage);

// ─── SEO Websites (separate from CRM Projects) ────────────────────────────
// Collection: seowebsites  |  Prefix: /seo-intelligence/websites
router.route('/websites')
  .get(seoController.getProjects)
  .post(seoController.createProject);

router.route('/websites/:id')
  .put(seoController.updateProject)
  .delete(seoController.deleteProject);

// ─── Keyword Research (standalone, no website required) ───────────────────
router.post('/keywords/research', seoController.researchKeywords);

// ─── Per-Website Keyword Tracking ─────────────────────────────────────────
router.route('/websites/:projectId/keywords')
  .get(seoController.getTrackedKeywords)
  .post(seoController.addKeywordsToTracking);

router.delete('/websites/:projectId/keywords/:keywordId', seoController.removeKeyword);
router.post('/websites/:projectId/keywords/refresh',      seoController.refreshRankings);

// ─── Site Audit ────────────────────────────────────────────────────────────
router.post('/websites/:projectId/audit', seoController.runAudit);

// ─── Backlinks ─────────────────────────────────────────────────────────────
router.get('/websites/:projectId/backlinks', seoController.getBacklinks);

// ─── Advanced Analytics ────────────────────────────────────────────────────
router.get('/websites/:projectId/domain-overview',    seoController.getDomainOverview);
router.get('/websites/:projectId/competitors',        seoController.getCompetitors);
router.post('/websites/:projectId/page-speed',        seoController.getPageSpeed);
router.get('/websites/:projectId/local-seo',          seoController.getLocalSeo);
router.post('/websites/:projectId/content-analysis',  seoController.getContentAnalysis);

module.exports = router;
