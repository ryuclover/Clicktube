const mongoose = require('mongoose');

/**
 * Blocks DB-dependent routes when Mongoose is not connected.
 * Returns 503 with a machine-readable code so the frontend
 * can show "database unavailable" instead of a generic error.
 */
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    code: 'DB_UNAVAILABLE',
    message: 'Database unavailable. Please try again in a moment.'
  });
};

module.exports = { requireDb };
