const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, userSchema } = require('../middleware/validationMiddleware');
const { uploadProfilePicture } = require('../middleware/uploadMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole,
  resetPassword,
  uploadProfilePicture: uploadProfilePictureController
} = require('../controllers/userController');
const { register } = require('../controllers/authController');

// User CRUD routes
router.route('/')
  .get(protect, authorize('admin'), getAllUsers)
  .post(protect, authorize('admin'), register);

router.route('/:id')
  .get(protect, authorize('admin'), getUserById)
  .put(protect, authorize('admin'), validate(userSchema), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

// Role management
router.put('/:id/role', protect, authorize('admin'), updateRole);

// Password reset (admin only)
router.put('/:id/reset-password', protect, authorize('admin'), resetPassword);

// Upload profile picture
router.post('/profile-picture', protect, uploadProfilePicture, uploadProfilePictureController);

module.exports = router; 