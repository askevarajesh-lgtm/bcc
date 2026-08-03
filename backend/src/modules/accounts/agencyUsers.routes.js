const express = require('express');
const router = express.Router();
const { getAgencyUsers, createAgencyUser, deleteAgencyUser, updateAgencyUser } = require('./agencyUsers.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(getAgencyUsers)
  .post(createAgencyUser);

router.route('/:id')
  .put(updateAgencyUser)
  .delete(deleteAgencyUser);

module.exports = router;
