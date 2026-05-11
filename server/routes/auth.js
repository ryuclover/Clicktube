const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
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
      avatar: `https://i.pravatar.cc/150?u=${username}`
    });

    await user.save();

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username, email, avatar: user.avatar, role: user.role } });
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

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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
    }).select('id username avatar bio subscribers -_id');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
