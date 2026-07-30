const express = require('express');
const router = express.Router();
const controller = require('./contentAI.controller');
const { verifyToken } = require('../../middlewares/rbac.middleware');

router.use(verifyToken);

// Same VIEW_ONLY_ROLES / blockViewOnly pattern as seoWorkspace.routes.js —
// duplicated deliberately (not exported from a shared location today).
const VIEW_ONLY_ROLES = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'];
const blockViewOnly = (req, res, next) => {
  if (VIEW_ONLY_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden. Your role has read-only access to Content AI.' });
  }
  next();
};

router.get('/generators', controller.listGenerators);

router.route('/brand-voices')
  .get(controller.listBrandVoices)
  .post(blockViewOnly, controller.createBrandVoice);
router.put('/brand-voices/:id', blockViewOnly, controller.updateBrandVoice);
router.delete('/brand-voices/:id', blockViewOnly, controller.deleteBrandVoice);

router.route('/templates')
  .get(controller.listTemplates)
  .post(blockViewOnly, controller.createTemplate);
router.put('/templates/:id', blockViewOnly, controller.updateTemplate);
router.delete('/templates/:id', blockViewOnly, controller.deleteTemplate);

router.route('/pieces')
  .get(controller.listContentPieces);
router.post('/pieces/generate', blockViewOnly, controller.generateContent);
router.post('/pieces/:id/regenerate', blockViewOnly, controller.regenerateContent);
router.get('/pieces/:id', controller.getContentPiece);
router.get('/pieces/:id/versions', controller.listVersions);
router.post('/pieces/:id/restore/:versionId', blockViewOnly, controller.restoreVersion);

router.put('/pieces/:id/submit-review', blockViewOnly, controller.submitForReview);
router.put('/pieces/:id/approve', blockViewOnly, controller.approveContent);
router.put('/pieces/:id/reject', blockViewOnly, controller.rejectContent);
router.post('/pieces/:id/publish', blockViewOnly, controller.publishContent);

router.get('/pieces/:id/quality-score', controller.getQualityScore);
router.get('/quality-report', controller.getQualityReport);

module.exports = router;
