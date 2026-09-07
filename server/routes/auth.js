const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const uploadAvatar = require('../middleware/uploadAvatar');
const { requireAuth } = require('../middleware/auth');
const { setAuthCookies, clearAuthCookies } = require('../config/tokens');
const { getAvatarUrl, DEFAULT_AVATAR } = require('../utils/display');
const env = require('../config/env');

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
 * @body    {string} username - Chosen username
 * @body    {string} email - User email address
 * @body    {string} password - Minimum 6 characters
 */
router.post('/register', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
], async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      avatar: DEFAULT_AVATAR,
      profilePicture: DEFAULT_AVATAR
    });

    await user.save();

    const { access } = setAuthCookies(res, { id: user.id, role: user.role });
    res.json({ token: access, user: { id: user.id, username, email, avatar: getAvatarUrl(user), profilePicture: user.profilePicture || getAvatarUrl(user), role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 * @body    {string} email - User email address
 * @body    {string} password - User password
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { access } = setAuthCookies(res, { id: user.id, role: user.role });
    res.json({ token: access, user: { id: user.id, username: user.username, email: user.email, avatar: getAvatarUrl(user), profilePicture: user.profilePicture || getAvatarUrl(user), role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotate access token using httpOnly refresh cookie
 * @access  Public (requires valid ct_refresh cookie)
 */
router.post('/refresh', (req, res) => {
  const token = req.cookies && req.cookies.ct_refresh;
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'No refresh token' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.typ !== 'refresh') {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' });
    }
    const { access } = setAuthCookies(res, { id: payload.id, role: payload.role });
    return res.json({ token: access });
  } catch {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookies
 * @access  Public
 */
router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
});

/**
 * @route   GET /api/auth/search
 * @desc    Search for channels (users)
 * @access  Public
 * @query   {string} q - The partial username to search for
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    }).select('id username avatar profilePicture bio subscribers -_id').lean();

    res.json(users.map((channel) => ({
      ...channel,
      avatar: getAvatarUrl(channel),
      profilePicture: channel.profilePicture || getAvatarUrl(channel)
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/upload-avatar
 * @desc    Upload a profile picture for the user
 * @access  Private
 * @body    {file} profilePicture - Image file
 * @body    {string} userId - User ID
 */
router.post('/upload-avatar', requireAuth, uploadAvatar.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // URL da imagem do Cloudinary
    const avatarUrl = req.file.path || req.file.secure_url;
    
    user.profilePicture = avatarUrl;
    user.avatar = avatarUrl;
    await user.save();

    res.json({ 
      message: 'Avatar uploaded successfully', 
      avatar: getAvatarUrl(user),
      user: { id: user.id, username: user.username, avatar: getAvatarUrl(user), profilePicture: user.profilePicture || getAvatarUrl(user) }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
