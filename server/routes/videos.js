const express = require('express');
const { uploadCloud } = require('../config/cloudinary');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/requireDb');
const videoController = require('../controllers/videoController');

const router = express.Router();

/**
 * @route   GET /api/videos
 * @desc    Get videos with filtering, sorting, and pagination
 * @access  Public (optionally authenticated to see own private/draft videos)
 */
router.get('/', optionalAuth, requireDb, videoController.getVideos);

/**
 * @route   GET /api/videos/suggestions
 * @desc    Get search suggestions based on partial title
 * @access  Public
 */
router.get('/suggestions', requireDb, videoController.getSuggestions);

/**
 * @route   POST /api/videos/upload
 * @desc    Upload a new video and thumbnail to Cloudinary
 * @access  Private
 */
router.post(
  '/upload',
  requireAuth,
  requireDb,
  uploadCloud.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  videoController.uploadVideo
);

/**
 * @route   GET /api/videos/:id
 * @desc    Get a single video by its ID
 * @access  Public
 */
router.get('/:id', optionalAuth, requireDb, videoController.getVideoById);

/**
 * @route   POST /api/videos/:id/view
 * @desc    Increment view count for a video
 * @access  Public
 */
router.post('/:id/view', optionalAuth, requireDb, videoController.recordView);

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete a video (owner or admin)
 * @access  Private
 */
router.delete('/:id', requireAuth, requireDb, videoController.deleteVideo);

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video metadata (owner only)
 * @access  Private
 */
router.put(
  '/:id',
  requireAuth,
  requireDb,
  videoController.checkVideoOwner,
  uploadCloud.single('thumbnail'),
  videoController.updateVideo
);

module.exports = router;
