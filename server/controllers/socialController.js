const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Video = require('../models/Video');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Subscription = require('../models/Subscription');
const History = require('../models/History');
const Playlist = require('../models/Playlist');
const { getAvatarUrl, formatDateBR } = require('../utils/display');

// Internal helper to create notifications
const createNotification = async ({ userId, type, fromUser, videoId, message }) => {
  try {
    const notification = new Notification({
      id: uuidv4(),
      userId,
      type,
      fromUser: {
        id: fromUser.id,
        username: fromUser.username,
        avatar: getAvatarUrl(fromUser)
      },
      videoId: videoId || null,
      message
    });
    await notification.save();
  } catch (error) {
    console.error('Notification creation failed', error);
  }
};

const getPagination = (req, def = 20, max = 50) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(req.query.limit, 10) || def));
  return { page, limit, skip: (page - 1) * limit };
};

const requireOwnerOrAdmin = (req, res, next) => {
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only access your own data' });
  }
  next();
};

// Comments & Replies
const addComment = async (req, res) => {
  try {
    const { videoId, text, parentId } = req.body;
    const userId = req.user.id;
    if (!videoId || !text || !text.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'videoId and text are required' });
    }
    const user = await User.findOne({ id: userId });
    const video = await Video.findOne({ id: videoId, deletedAt: null });
    if (!video) return res.status(404).json({ code: 'NOT_FOUND', message: 'Video not found' });

    const newComment = new Comment({
      id: uuidv4(),
      videoId,
      userId,
      username: user ? user.username : 'User',
      avatar: getAvatarUrl(user),
      text,
      parentId: parentId || null
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

    res.json({
      ...newComment.toObject(),
      avatar: getAvatarUrl(newComment.avatar),
      timestamp: formatDateBR(newComment.createdAt)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req, 20, 100);
    const [comments, total] = await Promise.all([
      Comment.find({ videoId: req.params.videoId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Comment.countDocuments({ videoId: req.params.videoId }),
    ]);
    const items = comments.map((comment) => ({
      ...comment,
      avatar: getAvatarUrl(comment.avatar),
      timestamp: formatDateBR(comment.createdAt)
    }));
    // Back-compat: plain array when no pagination params given
    if (!req.query.page && !req.query.limit) return res.json(items);
    res.json({ comments: items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

// Likes & Dislikes
const toggleLike = async (req, res) => {
  try {
    const { videoId, type } = req.body;
    const userId = req.user.id;
    if (!videoId || !['like', 'dislike'].includes(type)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'videoId and valid type are required' });
    }

    const existing = await Like.findOne({ videoId, userId });

    if (existing && existing.type === type) {
      // Same type clicked again → toggle OFF (remove the like/dislike)
      await Like.findOneAndDelete({ videoId, userId });
      return res.json({ success: true, action: 'removed' });
    }

    // Different type or no existing interaction → replace/insert
    await Like.findOneAndDelete({ videoId, userId });
    await new Like({ videoId, userId, type }).save();
    res.json({ success: true, action: 'added' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Subscriptions
const toggleSubscribe = async (req, res) => {
  try {
    const { channelId } = req.body;
    const userId = req.user.id;

    if (!channelId) {
      return res.status(400).json({ message: 'Channel ID is required' });
    }

    if (userId === channelId) {
      return res.status(400).json({ message: 'You cannot subscribe to your own channel' });
    }

    const user = await User.findOne({ id: userId });
    const existing = await Subscription.findOne({ userId, channelId });

    if (existing) {
      await Subscription.findOneAndDelete({ userId, channelId });
      return res.json({ success: true, subscribed: false });
    }

    const newSub = new Subscription({
      id: uuidv4(),
      userId,
      channelId
    });
    await newSub.save();

    await createNotification({
      userId: channelId,
      type: 'subscribe',
      fromUser: user,
      message: 'subscribed to your channel!'
    });

    return res.json({ success: true, subscribed: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already subscribed' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const userSubs = await Subscription.find({ userId: req.params.userId });
    const subscribedChannels = await Promise.all(userSubs.map(async (sub) => {
      const channel = await User.findOne({ id: sub.channelId });
      return channel ? { id: channel.id, username: channel.username, avatar: getAvatarUrl(channel) } : null;
    }));
    res.json(subscribedChannels.filter(Boolean));
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

// History
const recordHistory = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.user.id;
    if (!videoId) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'videoId is required' });
    }

    await History.findOneAndUpdate(
      { userId, videoId },
      { watchedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [entries, total] = await Promise.all([
      History.find({ userId: req.params.userId }).sort({ watchedAt: -1 }).skip(skip).limit(limit).lean(),
      History.countDocuments({ userId: req.params.userId }),
    ]);
    if (!entries.length) return res.json({ videos: [], total, page, totalPages: Math.ceil(total / limit) });

    const videoIds = entries.map((e) => e.videoId);
    const videos = await Video.find({ id: { $in: videoIds }, deletedAt: null }).lean();
    const byId = new Map(videos.map((v) => [v.id, v]));

    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const v = byId.get(entry.videoId);
        if (!v) return null;
        const uploader = await User.findOne({ id: v.uploaderId });
        return {
          ...v,
          userId: v.uploaderId,
          channel: uploader ? uploader.username : 'Unknown',
          channelAvatar: getAvatarUrl(uploader),
          viewsCount: v.views,
          views: `${v.views} views`,
          timestamp: formatDateBR(v.createdAt),
          watchedAt: entry.watchedAt,
        };
      })
    );
    const videosOut = enriched.filter(Boolean);
    res.json({ videos: videosOut, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

const getLikedVideos = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [likes, total] = await Promise.all([
      Like.find({ userId: req.params.userId, type: 'like' }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Like.countDocuments({ userId: req.params.userId, type: 'like' }),
    ]);
    if (!likes.length) return res.json({ videos: [], total, page, totalPages: Math.ceil(total / limit) });

    const videoIds = likes.map((l) => l.videoId);
    const videos = await Video.find({ id: { $in: videoIds }, deletedAt: null }).lean();
    const byId = new Map(videos.map((v) => [v.id, v]));

    const enriched = await Promise.all(
      likes.map(async (like) => {
        const v = byId.get(like.videoId);
        if (!v) return null;
        const uploader = await User.findOne({ id: v.uploaderId });
        return {
          ...v,
          userId: v.uploaderId,
          channel: uploader ? uploader.username : 'Unknown',
          channelAvatar: getAvatarUrl(uploader),
          viewsCount: v.views,
          views: `${v.views} views`,
          timestamp: formatDateBR(v.createdAt),
        };
      })
    );
    const likedOut = enriched.filter(Boolean);
    res.json({ videos: likedOut, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

// Notifications
const getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [userNotifications, total] = await Promise.all([
      Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId: req.params.userId }),
    ]);
    res.json({ notifications: userNotifications, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate({ id: req.params.id, userId: req.user.id }, { read: true });
    if (!updated) return res.status(404).json({ code: 'NOT_FOUND', message: 'Notification not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Profile Management
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const subscribers = await Subscription.countDocuments({ channelId: req.params.userId });
    const videosCount = await Video.countDocuments({ uploaderId: req.params.userId });
    
    const { password, ...safeUser } = user.toObject();
    res.json({
      ...safeUser,
      avatar: getAvatarUrl(safeUser),
      profilePicture: safeUser.profilePicture || getAvatarUrl(safeUser),
      language: safeUser.language || 'en',
      subscribers,
      videosCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only edit your own profile' });
    }
    const { bio, username, banner, language } = req.body;
    
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $set: { bio, username, banner, ...(language ? { language } : {}) } },
      { new: true }
    );
    
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    
    const subscribers = await Subscription.countDocuments({ channelId: userId });
    const videosCount = await Video.countDocuments({ uploaderId: userId });
    const { password, ...safeUser } = updatedUser.toObject();
    
    res.json({
      ...safeUser,
      avatar: getAvatarUrl(safeUser),
      profilePicture: safeUser.profilePicture || getAvatarUrl(safeUser),
      subscribers,
      videosCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Playlists
const createPlaylist = async (req, res) => {
  try {
    const { name, videoIds } = req.body;
    const userId = req.user.id;
    if (!name || !name.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Playlist name is required' });
    }
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
};

const getUserPlaylists = async (req, res) => {
  try {
    const userPlaylists = await Playlist.find({ userId: req.params.userId });
    res.json(userPlaylists);
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

const getPlaylistDetail = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ id: req.params.id }).lean();
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    
    let videos = await Video.find({ id: { $in: playlist.videoIds }, deletedAt: null }).lean();
    
    videos = await Promise.all(videos.map(async (v) => {
      const uploader = await User.findOne({ id: v.uploaderId });
      return {
        ...v,
        userId: v.uploaderId,
        channel: uploader ? uploader.username : 'Unknown',
        channelAvatar: getAvatarUrl(uploader),
        viewsCount: v.views,
        views: `${v.views} views`,
        timestamp: formatDateBR(v.createdAt),
      };
    }));

    res.json({
      ...playlist,
      videos
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const togglePlaylistVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoId } = req.body;
    const playlist = await Playlist.findOne({ id });

    if (!playlist) return res.status(404).json({ code: 'NOT_FOUND', message: 'Playlist not found' });
    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You do not own this playlist' });
    }

    if (playlist.videoIds.includes(videoId)) {
      playlist.videoIds = playlist.videoIds.filter(vid => vid !== videoId);
    } else {
      playlist.videoIds.push(videoId);
    }
    await playlist.save();
    return res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addComment,
  getComments,
  toggleLike,
  toggleSubscribe,
  getSubscriptions,
  recordHistory,
  getHistory,
  getLikedVideos,
  getNotifications,
  markNotificationRead,
  getProfile,
  updateProfile,
  createPlaylist,
  getUserPlaylists,
  getPlaylistDetail,
  togglePlaylistVideo,
  requireOwnerOrAdmin
};
