const express = require('express');
const router = express.Router();
const recruitmentController = require('./recruitment.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(recruitmentController.getRecruitments)
  .post(recruitmentController.createRecruitment);

router
  .route('/:id/candidates')
  .post(recruitmentController.addCandidate);

router
  .route('/:id/candidates/:candidateId')
  .put(recruitmentController.updateCandidateStatus);

module.exports = router;
