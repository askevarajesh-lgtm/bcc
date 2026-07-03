const express = require('express');
const router = express.Router();
const trainingController = require('./training.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router
  .route('/')
  .get(trainingController.getTrainings)
  .post(trainingController.createTraining);

router
  .route('/:id/progress')
  .put(trainingController.updateTrainingProgress);

module.exports = router;
