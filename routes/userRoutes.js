const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/rbac');

// All routes require authentication
router.use(requireAuth);

// All routes require admin or superadmin role
router.use(requireRole('admin', 'superadmin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(requireRole('superadmin'), deleteUser); // Only superadmin can delete

module.exports = router;

