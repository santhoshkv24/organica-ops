const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, userSchema } = require('../middleware/validationMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole,
  resetPassword
} = require('../controllers/userController');

// User CRUD routes
router.route('/')
  .get(protect, authorize('admin'), getAllUsers);

router.route('/:id')
  .get(protect, authorize('admin'), getUserById)
  .put(protect, authorize('admin'), validate(userSchema), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

// Role management
router.put('/:id/role', protect, authorize('admin'), updateRole);

// Password reset (admin only)
router.put('/:id/reset-password', protect, authorize('admin'), resetPassword);

module.exports = router; 