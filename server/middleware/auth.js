const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Required authentication middleware.
 * Verifies the JWT from the Authorization header.
 * Sets req.user = { id, role } if valid, otherwise returns 401.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication middleware.
 * If a valid JWT is present, sets req.user. Otherwise continues without error.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, env.JWT_SECRET);
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
