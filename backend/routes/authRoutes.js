const express = require('express');
const router = express.Router();
const { validate, userSchema, loginSchema } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  logout,
  getMe,
  changePassword
} = require('../controllers/authController');

router.post('/register', validate(userSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
