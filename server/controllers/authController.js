const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { setAuthCookies, clearAuthCookies } = require('../config/tokens');
const { getAvatarUrl, DEFAULT_AVATAR } = require('../utils/display');
const env = require('../config/env');

const escapeRegex = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Controller for authentication and user profile operations
 */

const register = async (req, res) => {
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
    res.json({
      token: access,
      user: {
        id: user.id,
        username,
        email,
        avatar: getAvatarUrl(user),
        profilePicture: user.profilePicture || getAvatarUrl(user),
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const { access } = setAuthCookies(res, { id: user.id, role: user.role });
    res.json({
      token: access,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: getAvatarUrl(user),
        profilePicture: user.profilePicture || getAvatarUrl(user),
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const refreshToken = (req, res) => {
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
};

const logout = (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).lean();
    if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: getAvatarUrl(user),
        profilePicture: user.profilePicture || getAvatarUrl(user),
        role: user.role,
        bio: user.bio || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const escaped = escapeRegex(q.trim());
    const users = await User.find({
      username: { $regex: escaped, $options: 'i' }
    }).select('id username avatar profilePicture bio subscribers -_id').limit(20).lean();

    res.json(users.map((channel) => ({
      ...channel,
      avatar: getAvatarUrl(channel),
      profilePicture: channel.profilePicture || getAvatarUrl(channel)
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = req.file.path || req.file.secure_url;
    
    user.profilePicture = avatarUrl;
    user.avatar = avatarUrl;
    await user.save();

    res.json({ 
      message: 'Avatar uploaded successfully', 
      avatar: getAvatarUrl(user),
      user: {
        id: user.id,
        username: user.username,
        avatar: getAvatarUrl(user),
        profilePicture: user.profilePicture || getAvatarUrl(user)
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  searchUsers,
  uploadAvatar
};
