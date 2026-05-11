const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const User = require('../models/User');
const { uploadCloud } = require('../config/cloudinary');

const router = express.Router();

/**
 * @route   GET /api/videos
 * @desc    Get videos with filtering, sorting, and pagination
 * @access  Public
 * @query   {string} category - Filter by video category
 * @query   {string} sort - Sort by 'views' or 'createdAt' (default)
 * @query   {string} search - Search by title or description
 * @query   {string} status - Filter by 'public', 'private', or 'draft'
 * @query   {string} userId - Filter by uploader ID
 * @query   {number} page - Page number for pagination
 * @query   {number} limit - Items per page
 */
router.get('/', async (req, res) => {
  try {
    const { category, sort, search, status, userId, page = 1, limit = 12 } = req.query;
    
    let query = {};
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Filter by status (default public)
    if (status) {
      query.status = status;
    } else if (userId) {
      // If userId provided, show all their videos (including private/draft)
      query.uploaderId = userId; // Note: Video schema uses uploaderId
    } else {
      query.status = { $in: ['public', null, undefined] };
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by search
    if (search) {
      const q = search;
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Sorting
    let sortObj = { createdAt: -1 };
    if (sort === 'views') {
      sortObj = { views: -1 };
    }

    const total = await Video.countDocuments(query);
    let videos = await Video.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Map fields for frontend compatibility
    videos = await Promise.all(videos.map(async (v) => {
      const uploader = await User.findOne({ id: v.uploaderId });
      return {
        ...v,
        userId: v.uploaderId, // map uploaderId to userId for frontend
        channel: uploader ? uploader.username : 'Unknown',
        channelAvatar: uploader ? uploader.avatar : 'https://i.pravatar.cc/150',
        viewsCount: v.views,
        views: `${v.views} views`, // legacy compatibility
        timestamp: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Just now',
        likes: 0 // Will be handled by social routes if needed, or we just leave 0
      };
    }));

    res.json({
      videos,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment views
/**
 * @route   GET /api/videos/:id
 * @desc    Get a single video by its ID
 * @access  Public
 * @param   {string} id - The video UUID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Exclude 'suggestions' and other named routes from hitting this
    if (id === 'suggestions') return res.status(400).json({ message: 'Invalid route' });

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
 * @route   GET /api/videos/suggestions
 * @desc    Get search suggestions based on partial title
 * @access  Public
 * @query   {string} q - The partial title to search for
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const videos = await Video.find({
      title: { $regex: q, $options: 'i' }
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
 * @body    {string} title - Video title
 * @body    {string} description - Video description
 * @body    {string} category - Video category
 * @body    {string} userId - ID of the uploader
 * @body    {string} status - 'public', 'private', or 'draft'
 * @body    {string} duration - Hardcoded or client-side duration
 * @files   {video} video - The video file
 * @files   {thumbnail} thumbnail - The thumbnail image file
 */
router.post('/upload', uploadCloud.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, category, userId, status, duration } = req.body;
    
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
      status: status || 'public', // Need to add status to schema if missing
      duration: duration || '0:00', // Need to add duration to schema if missing
      url: videoFile.path, // Cloudinary path
      thumbnail: thumbnailFile ? thumbnailFile.path : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    const video = await Video.findOne({ id });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    
    // Check if requester is owner or admin
    const requester = await User.findOne({ id: userId });
    const isOwner = video.uploaderId === userId;
    const isAdmin = requester && requester.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Video.deleteOne({ id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update video (Edit)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, status, userId } = req.body;

    const video = await Video.findOne({ id });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (video.uploaderId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    
    // Using strict mode bypass if schema doesn't have status, but it's better to update schema
    // Let's add status and duration to the save if it works, or we update the schema later.
    video.set('status', status || video.get('status'));

    await video.save();
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
