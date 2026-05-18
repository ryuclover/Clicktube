const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { uploadCloud } = require('../config/cloudinary');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/videos
 * @desc    Get videos with filtering, sorting, and pagination
 * @access  Public (optionally authenticated to see own private/draft videos)
 * @query   {string}  category  - Filter by category
 * @query   {string}  sort      - Sort by 'views' or 'createdAt' (default)
 * @query   {string}  search    - Search by title or description
 * @query   {string}  status    - Filter by 'public', 'private', or 'draft'
 * @query   {string}  userId    - Filter by uploader ID
 * @query   {boolean} withStats - If 'true', includes likeCount and commentCount
 * @query   {number}  page      - Page number
 * @query   {number}  limit     - Items per page
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, sort, search, status, userId, withStats, page = 1, limit = 12 } = req.query;

    let query = {};
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    if (status) {
      query.status = status;
    } else if (userId) {
      query.uploaderId = userId;
      // BUG #13 FIX: Only show private/draft if the authenticated requester is the owner
      const isOwner = req.user && req.user.id === userId;
      if (!isOwner) {
        query.status = 'public';
      }
    } else {
      query.status = { $in: ['public', null, undefined] };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'views') sortObj = { views: -1 };

    const total = await Video.countDocuments(query);
    let videos = await Video.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    videos = await Promise.all(videos.map(async (v) => {
      const uploader = await User.findOne({ id: v.uploaderId });

      let extraStats = {};
      if (withStats === 'true') {
        const [likeCount, commentCount] = await Promise.all([
          Like.countDocuments({ videoId: v.id, type: 'like' }),
          Comment.countDocuments({ videoId: v.id })
        ]);
        extraStats = { likeCount, commentCount };
      }

      return {
        ...v,
        userId: v.uploaderId,
        channel: uploader ? uploader.username : 'Unknown',
        channelAvatar: uploader ? uploader.avatar : 'https://i.pravatar.cc/150',
        viewsCount: v.views,
        views: `${v.views} views`,
        timestamp: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Just now',
        likes: 0,
        ...extraStats
      };
    }));

    res.json({ videos, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/videos/suggestions
 * @desc    Get search suggestions based on partial title
 * @access  Public
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const videos = await Video.find({
      title: { $regex: q, $options: 'i' },
      status: 'public'
    }).limit(10).select('title');

    res.json(videos.map(v => v.title));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/videos/upload
 * @desc    Upload a new video and thumbnail to Cloudinary
 * @access  Private
 *
 * BUG #1 FIX: Moved BEFORE /:id routes to prevent Express from treating
 * "upload" as a dynamic :id parameter and making this route unreachable.
 */
router.post(
  '/upload',
  requireAuth,
  uploadCloud.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, category, status, duration } = req.body;
      // BUG #5/#6 FIX: userId comes from verified JWT, not from the request body
      const userId = req.user.id;

      const videoFile = req.files['video'] ? req.files['video'][0] : null;
      const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (!videoFile) {
        return res.status(400).json({ message: 'Video file is required' });
      }

      const user = await User.findOne({ id: userId });

      const newVideo = new Video({
        id: uuidv4(),
        title,
        description,
        category,
        status: status || 'public',
        duration: duration || '0:00',
        url: videoFile.path,
        thumbnail: thumbnailFile
          ? thumbnailFile.path
          : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
        uploaderId: userId,
        views: 0
      });

      await newVideo.save();

      const videoObj = {
        ...newVideo.toObject(),
        userId: newVideo.uploaderId,
        channel: user ? user.username : 'Unknown',
        channelAvatar: user ? user.avatar : 'https://i.pravatar.cc/150',
        viewsCount: 0,
        views: '0 views',
        timestamp: 'Just now',
        likes: 0
      };

      res.status(201).json(videoObj);
    } catch (error) {
      console.error('Error during video upload:', error);
      res.status(500).json({ message: error.message || 'Server error' });
    }
  }
);

/**
 * @route   GET /api/videos/:id
 * @desc    Get a single video by its ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findOne({ id }).lean();
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const uploader = await User.findOne({ id: video.uploaderId });
    const enriched = {
      ...video,
      userId: video.uploaderId,
      channel: uploader ? uploader.username : 'Unknown',
      channelAvatar: uploader ? uploader.avatar : 'https://i.pravatar.cc/150',
      viewsCount: video.views,
      views: `${video.views} views`,
      timestamp: video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Just now',
    };

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/videos/:id/view
 * @desc    Increment view count for a video
 * @access  Public
 *
 * BUG #1 FIX: Now safely placed AFTER /upload and /suggestions so there
 * is no route conflict.
 */
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ id });

    if (video) {
      video.views += 1;
      await video.save();
      return res.json({ success: true, views: video.views });
    }

    res.status(404).json({ message: 'Video not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete a video (owner or admin)
 * @access  Private
 *
 * BUG #5 FIX: userId now extracted from verified JWT (req.user.id),
 * not from an untrusted query string parameter.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    const video = await Video.findOne({ id });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const isOwner = video.uploaderId === requesterId;
    const isAdmin = requesterRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Video.deleteOne({ id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video metadata (owner only)
 * @access  Private
 *
 * BUG #6 FIX: userId now extracted from verified JWT (req.user.id),
 * not from an untrusted request body.
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, status } = req.body;
    const requesterId = req.user.id;

    const video = await Video.findOne({ id });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (video.uploaderId !== requesterId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (category) video.category = category;
    if (status) video.status = status;

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
