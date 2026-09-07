const jwt = require('jsonwebtoken');
const env = require('../config/env');

const extractToken = (req) => {
  // P0: prefer httpOnly cookie, keep Bearer fallback for transition period
  if (req.cookies && req.cookies.ct_access) return req.cookies.ct_access;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return null;
};

/**
 * Required authentication middleware.
 * Verifies the JWT from cookie or Authorization header.
 * Sets req.user = { id, role } if valid, otherwise returns 401.
 */
const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication middleware.
 * If a valid JWT is present, sets req.user. Otherwise continues without error.
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, env.JWT_SECRET);
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
