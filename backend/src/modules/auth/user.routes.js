const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router.route('/dropdown')
  .get(userController.getUsersDropdown);

router.route('/change-password')
  .post(userController.changePassword);

router.route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
