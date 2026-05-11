const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Video = require('../models/Video');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Subscription = require('../models/Subscription');
const History = require('../models/History');
const Playlist = require('../models/Playlist');

const router = express.Router();

// Helper to create notifications
const createNotification = async ({ userId, type, fromUser, videoId, message }) => {
  try {
    const notification = new Notification({
      id: uuidv4(),
      userId,
      type,
      fromUser: {
        id: fromUser.id,
        username: fromUser.username,
        avatar: fromUser.avatar
      },
      videoId: videoId || null,
      message
    });
    await notification.save();
  } catch (error) {
    console.error('Notification creation failed', error);
  }
};

// Comments & Replies
/**
 * @route   POST /api/social/comment
 * @desc    Add a comment or reply to a video
 * @access  Private
 * @body    {string} videoId - The video ID
 * @body    {string} userId - The user ID
 * @body    {string} text - The comment text
 * @body    {string} parentId - (Optional) ID of the parent comment if it's a reply
 */
router.post('/comment', async (req, res) => {
  try {
    const { videoId, userId, text, parentId } = req.body;
    const user = await User.findOne({ id: userId });
    const video = await Video.findOne({ id: videoId });

    const newComment = new Comment({
      id: uuidv4(),
      videoId,
      userId,
      username: user ? user.username : 'User',
      avatar: user ? user.avatar : '',
      text,
      parentId: parentId || null,
      timestamp: 'Just now'
    });

    await newComment.save();

    // Notify video owner
    if (video && video.uploaderId !== userId) {
      await createNotification({
        userId: video.uploaderId,
        type: 'comment',
        fromUser: user,
        videoId,
        message: `commented on your video: "${video.title}"`
      });
    }

    res.json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/comments/:videoId', async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Likes & Dislikes
/**
 * @route   POST /api/social/like
 * @desc    Like or dislike a video (replaces existing interaction)
 * @access  Private
 * @body    {string} videoId - The video ID
 * @body    {string} userId - The user ID
 * @body    {string} type - 'like' or 'dislike'
 */
router.post('/like', async (req, res) => {
  try {
    const { videoId, userId, type } = req.body; 
    await Like.findOneAndDelete({ videoId, userId });
    
    const newLike = new Like({
      id: uuidv4(),
      videoId,
      userId,
      type
    });
    
    await newLike.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscriptions
/**
 * @route   POST /api/social/subscribe
 * @desc    Toggle subscription to a channel
 * @access  Private
 * @body    {string} userId - The follower user ID
 * @body    {string} channelId - The target channel (user) ID
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, channelId } = req.body;
    const user = await User.findOne({ id: userId });
    const existing = await Subscription.findOne({ userId, channelId });
    
    if (existing) {
      await Subscription.findOneAndDelete({ userId, channelId });
      res.json({ success: true, subscribed: false });
    } else {
      const newSub = new Subscription({
        id: uuidv4(),
        userId,
        channelId
      });
      await newSub.save();
      
      // Notify channel owner
      await createNotification({
        userId: channelId,
        type: 'subscribe',
        fromUser: user,
        message: 'subscribed to your channel!'
      });
      
      res.json({ success: true, subscribed: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/subscriptions/:userId', async (req, res) => {
  try {
    const userSubs = await Subscription.find({ userId: req.params.userId });
    const subscribedChannels = await Promise.all(userSubs.map(async (sub) => {
      const channel = await User.findOne({ id: sub.channelId });
      return channel ? { id: channel.id, username: channel.username, avatar: channel.avatar } : null;
    }));
    res.json(subscribedChannels.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// History
router.get('/history/:userId', async (req, res) => {
  try {
    const userHistory = await History.find({ userId: req.params.userId }).sort({ watchedAt: -1 });
    const historyVideos = await Promise.all(userHistory.map(async (h) => {
      return await Video.findOne({ id: h.videoId });
    }));
    res.json(historyVideos.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/social/history
 * @desc    Record a video view in user's watch history
 * @access  Private
 * @body    {string} userId - The user ID
 * @body    {string} videoId - The video ID
 */
router.post('/history', async (req, res) => {
  try {
    const { userId, videoId } = req.body;
    await History.findOneAndDelete({ userId, videoId });
    
    const newHistory = new History({
      userId,
      videoId,
      watchedAt: new Date()
    });
    
    await newHistory.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Notifications
router.get('/notifications/:userId', async (req, res) => {
  try {
    const userNotifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(userNotifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ id: req.params.id }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile Management
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/social/profile/:userId
 * @desc    Update user profile details
 * @access  Private
 * @param   {string} userId - The user ID
 * @body    {string} bio - User bio
 * @body    {string} username - User username
 * @body    {string} banner - Channel banner URL
 */
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bio, username, banner } = req.body;
    
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $set: { bio, username, banner } },
      { new: true }
    );
    
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Playlists
router.post('/playlists', async (req, res) => {
  try {
    const { userId, name, videoIds } = req.body;
    const newPlaylist = new Playlist({
      id: uuidv4(),
      userId,
      name,
      videoIds: videoIds || []
    });
    await newPlaylist.save();
    res.json(newPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/playlists/:userId', async (req, res) => {
  try {
    const userPlaylists = await Playlist.find({ userId: req.params.userId });
    res.json(userPlaylists);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/playlists/:id/video', async (req, res) => {
  try {
    const { id } = req.params;
    const { videoId } = req.body;
    const playlist = await Playlist.findOne({ id });
    
    if (playlist) {
      if (playlist.videoIds.includes(videoId)) {
        playlist.videoIds = playlist.videoIds.filter(vid => vid !== videoId);
      } else {
        playlist.videoIds.push(videoId);
      }
      await playlist.save();
      return res.json(playlist);
    }
    res.status(404).json({ message: 'Playlist not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
