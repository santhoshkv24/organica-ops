const axios = require('axios');

const verifyTurnstileToken = async (req, res, next) => {
  // Check both req.body and req.body['cf-turnstile-response'] for the token
  const token = req.body['cf-turnstile-response'] || req.body.token;
  
  if (!token) {
    return res.status(400).json({ success: false, message: 'Turnstile token is required' });
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.data.success) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid Turnstile token',
        errors: response.data['error-codes']
      });
    }

    next();
  } catch (error) {
    console.error('Turnstile verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying Turnstile token' 
    });
  }
};

module.exports = { verifyTurnstileToken };
