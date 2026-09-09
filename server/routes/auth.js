const express = require('express');
const { body, validationResult } = require('express-validator');
const uploadAvatar = require('../middleware/uploadAvatar');
const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/requireDb');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
  }
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  requireDb,
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post(
  '/login',
  requireDb,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotate access token using httpOnly refresh cookie
 * @access  Public (requires valid ct_refresh cookie)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookies
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', requireAuth, requireDb, authController.getCurrentUser);

/**
 * @route   GET /api/auth/search
 * @desc    Search for channels (users)
 * @access  Public
 */
router.get('/search', requireDb, authController.searchUsers);

/**
 * @route   POST /api/auth/upload-avatar
 * @desc    Upload a profile picture for the user
 * @access  Private
 */
router.post(
  '/upload-avatar',
  requireAuth,
  requireDb,
  uploadAvatar.single('profilePicture'),
  authController.uploadAvatar
);

module.exports = router;
