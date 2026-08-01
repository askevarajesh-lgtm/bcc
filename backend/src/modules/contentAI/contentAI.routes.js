const express = require('express');
const router = express.Router();
const contentAIController = require('./contentAI.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes would typically be protected by authenticate middleware
router.use(authMiddleware);

router.get('/generators', contentAIController.getGenerators);
router.get('/brand-voices', contentAIController.getBrandVoices);
router.post('/brand-voices', contentAIController.createBrandVoice);
router.put('/brand-voices/:id', contentAIController.updateBrandVoice);
router.delete('/brand-voices/:id', contentAIController.deleteBrandVoice);

router.get('/templates', contentAIController.getTemplates);
router.post('/templates', contentAIController.createTemplate);
router.put('/templates/:id', contentAIController.updateTemplate);
router.delete('/templates/:id', contentAIController.deleteTemplate);

router.post('/pieces/generate', contentAIController.generateContent);
router.post('/pieces/:id/regenerate', contentAIController.regenerateContent);
router.get('/pieces', contentAIController.getContentPieces);
router.get('/pieces/:id', contentAIController.getPieceById);
router.get('/pieces/:pieceId/versions', contentAIController.getPieceVersions);
router.post('/pieces/:id/restore/:versionId', contentAIController.restoreVersion);

router.put('/pieces/:id/submit-review', contentAIController.submitForReview);
router.put('/pieces/:id/approve', contentAIController.approveContent);
router.put('/pieces/:id/reject', contentAIController.rejectContent);
router.post('/pieces/:id/publish', contentAIController.publishContent);

router.get('/pieces/:id/quality-score', contentAIController.getQualityScore);
router.get('/quality-report', contentAIController.getQualityReport);

module.exports = router;
