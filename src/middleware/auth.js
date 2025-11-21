//src/middleware/auth.js
const JWTUtils = require('../utils/jwt');

const authenticateToken = (jwtUtils) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    try {
      const user = jwtUtils.verifyAccessToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
  };
};

const optionalAuth = (jwtUtils) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const user = jwtUtils.verifyAccessToken(token);
        req.user = user;
      } catch (error) {
        // Continue without user data
      }
    }
    next();
  };
};

module.exports = { authenticateToken, optionalAuth };