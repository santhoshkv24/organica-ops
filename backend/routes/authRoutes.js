const express = require('express');
const router = express.Router();
const { validate, userSchema, loginSchema, firstTimePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyResetCodeSchema } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { verifyTurnstileToken } = require('../middleware/turnstileMiddleware');
const {
  register,
  login,
  logout,
  getMe,
  changePassword,
  setFirstTimePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require('../controllers/authController');

// Routes with Turnstile protection
router.post('/register', validate(userSchema), verifyTurnstileToken, register);
router.post('/login', validate(loginSchema), verifyTurnstileToken, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/set-first-password', protect, validate(firstTimePasswordSchema), setFirstTimePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-code', validate(verifyResetCodeSchema), verifyResetCode);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
