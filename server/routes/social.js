const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/requireDb');
const socialController = require('../controllers/socialController');

const router = express.Router();

// Comments
router.post('/comment', requireAuth, requireDb, socialController.addComment);
router.get('/comments/:videoId', requireDb, socialController.getComments);

// Likes & Dislikes
router.post('/like', requireAuth, requireDb, socialController.toggleLike);

// Subscriptions
router.post('/subscribe', requireAuth, requireDb, socialController.toggleSubscribe);
router.get(
  '/subscriptions/:userId',
  requireAuth,
  socialController.requireOwnerOrAdmin,
  requireDb,
  socialController.getSubscriptions
);

// History
router.post('/history', requireAuth, requireDb, socialController.recordHistory);
router.get(
  '/history/:userId',
  requireAuth,
  socialController.requireOwnerOrAdmin,
  requireDb,
  socialController.getHistory
);

// Liked Videos
router.get(
  '/liked/:userId',
  requireAuth,
  socialController.requireOwnerOrAdmin,
  requireDb,
  socialController.getLikedVideos
);

// Notifications
router.get(
  '/notifications/:userId',
  requireAuth,
  socialController.requireOwnerOrAdmin,
  requireDb,
  socialController.getNotifications
);
router.put('/notifications/:id/read', requireAuth, requireDb, socialController.markNotificationRead);

// Profile Management
router.get('/profile/:userId', requireDb, socialController.getProfile);
router.put('/profile/:userId', requireAuth, requireDb, socialController.updateProfile);

// Playlists
router.post('/playlists', requireAuth, requireDb, socialController.createPlaylist);
router.get(
  '/playlists/:userId',
  requireAuth,
  socialController.requireOwnerOrAdmin,
  requireDb,
  socialController.getUserPlaylists
);
router.get('/playlists/detail/:id', requireDb, socialController.getPlaylistDetail);
router.post('/playlists/:id/video', requireAuth, requireDb, socialController.togglePlaylistVideo);

module.exports = router;
