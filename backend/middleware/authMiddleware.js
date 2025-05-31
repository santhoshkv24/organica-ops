const jwt = require('jsonwebtoken');
const { getOne } = require('../utils/dbUtils');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in cookies or Authorization header
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    // Get user from token
    const user = await getOne(
      'SELECT user_id, username, email, role FROM users WHERE user_id = ?',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized, insufficient permissions' });
    }
    next();
  };
};

module.exports = { protect, authorize };
