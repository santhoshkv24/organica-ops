const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Set JWT token in cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user.user_id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'lax'
  };

  // Add secure flag in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from response
  delete user.password;

  // Check if this is the first login
  const isFirstLogin = user.last_login === null;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        ...user,
        isFirstLogin
      }
    });
};

module.exports = { generateToken, sendTokenResponse };
