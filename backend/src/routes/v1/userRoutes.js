const express = require('express');
const router = express.Router();
const { getUsers, createUser, getUserById, updateUser, updateUserStatus, deleteUser, getActionLogs } = require('../../controllers/userController');

// Route: /api/v1/users/logs/action-history
// Must be defined before /:id so 'logs' isn't treated as an ID
router.route('/logs/action-history')
  .get(getActionLogs);

// Route: /api/v1/users
router.route('/')
  .get(getUsers)
  .post(createUser);

// Route: /api/v1/users/:id
router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);
// Route: /api/v1/users/:id/status
router.route('/:id/status')
  .put(updateUserStatus);

module.exports = router;
