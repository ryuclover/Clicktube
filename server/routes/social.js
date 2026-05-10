const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');

const router = express.Router();

// Helper to create notifications
const createNotification = (db, { userId, type, fromUser, videoId, message }) => {
  const notification = {
    id: uuidv4(),
    userId, // Target user
    type,
    fromUser: {
      id: fromUser.id,
      username: fromUser.username,
      avatar: fromUser.avatar
    },
    videoId: videoId || null,
    message,
    read: false,
    createdAt: new Date()
  };
  db.notifications.unshift(notification);
};

// Comments & Replies
router.post('/comment', (req, res) => {
  const { videoId, userId, text, parentId } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  const video = db.videos.find(v => v.id === videoId);

  const newComment = {
    id: uuidv4(),
    videoId,
    userId,
    username: user ? user.username : 'User',
    avatar: user ? user.avatar : '',
    text,
    parentId: parentId || null,
    timestamp: 'Just now'
  };

  db.comments.push(newComment);

  // Notify video owner
  if (video && video.userId !== userId) {
    createNotification(db, {
      userId: video.userId,
      type: 'comment',
      fromUser: user,
      videoId,
      message: `commented on your video: "${video.title}"`
    });
  }

  writeDB(db);
  res.json(newComment);
});

router.get('/comments/:videoId', (req, res) => {
  const db = readDB();
  const comments = db.comments.filter(c => c.videoId === req.params.videoId);
  res.json(comments);
});

// Likes & Dislikes
router.post('/like', (req, res) => {
  const { videoId, userId, type } = req.body; 
  const db = readDB();
  db.likes = db.likes.filter(l => !(l.videoId === videoId && l.userId === userId));
  db.likes.push({ videoId, userId, type });
  writeDB(db);
  res.json({ success: true });
});

// Subscriptions
router.post('/subscribe', (req, res) => {
  const { userId, channelId } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  const existing = db.subscriptions.find(s => s.userId === userId && s.channelId === channelId);
  
  if (existing) {
    db.subscriptions = db.subscriptions.filter(s => !(s.userId === userId && s.channelId === channelId));
  } else {
    db.subscriptions.push({ userId, channelId });
    // Notify channel owner
    createNotification(db, {
      userId: channelId,
      type: 'subscribe',
      fromUser: user,
      message: 'subscribed to your channel!'
    });
  }
  writeDB(db);
  res.json({ success: true, subscribed: !existing });
});

router.get('/subscriptions/:userId', (req, res) => {
  const db = readDB();
  const userSubs = db.subscriptions.filter(s => s.userId === req.params.userId);
  const subscribedChannels = userSubs.map(sub => {
    const channel = db.users.find(u => u.id === sub.channelId);
    return channel ? { id: channel.id, username: channel.username, avatar: channel.avatar } : null;
  }).filter(Boolean);
  res.json(subscribedChannels);
});

// History
router.get('/history/:userId', (req, res) => {
  const db = readDB();
  const userHistory = db.history.filter(h => h.userId === req.params.userId);
  const historyVideos = userHistory.map(h => {
    return db.videos.find(v => v.id === h.videoId);
  }).filter(Boolean);
  res.json(historyVideos);
});

router.post('/history', (req, res) => {
  const { userId, videoId } = req.body;
  const db = readDB();
  db.history = db.history.filter(h => !(h.userId === userId && h.videoId === videoId));
  db.history.unshift({ userId, videoId, watchedAt: new Date() });
  writeDB(db);
  res.json({ success: true });
});

// Notifications
router.get('/notifications/:userId', (req, res) => {
  const db = readDB();
  const userNotifications = db.notifications.filter(n => n.userId === req.params.userId);
  res.json(userNotifications);
});

router.put('/notifications/:id/read', (req, res) => {
  const db = readDB();
  const notifIndex = db.notifications.findIndex(n => n.id === req.params.id);
  if (notifIndex !== -1) {
    db.notifications[notifIndex].read = true;
    writeDB(db);
  }
  res.json({ success: true });
});

// Profile Management
router.get('/profile/:userId', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

router.put('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const { bio, username, banner } = req.body;
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
  db.users[userIndex] = { ...db.users[userIndex], bio: bio || db.users[userIndex].bio, username: username || db.users[userIndex].username, banner: banner || db.users[userIndex].banner };
  writeDB(db);
  res.json(db.users[userIndex]);
});

// Playlists
router.post('/playlists', (req, res) => {
  const { userId, name, videoIds } = req.body;
  const db = readDB();
  const newPlaylist = {
    id: uuidv4(),
    userId,
    name,
    videoIds: videoIds || [],
    createdAt: new Date()
  };
  db.playlists.push(newPlaylist);
  writeDB(db);
  res.json(newPlaylist);
});

router.get('/playlists/:userId', (req, res) => {
  const db = readDB();
  const userPlaylists = db.playlists.filter(p => p.userId === req.params.userId);
  res.json(userPlaylists);
});

router.post('/playlists/:id/video', (req, res) => {
  const { id } = req.params;
  const { videoId } = req.body;
  const db = readDB();
  const playlistIndex = db.playlists.findIndex(p => p.id === id);
  
  if (playlistIndex !== -1) {
    const p = db.playlists[playlistIndex];
    if (p.videoIds.includes(videoId)) {
      p.videoIds = p.videoIds.filter(vid => vid !== videoId);
    } else {
      p.videoIds.push(videoId);
    }
    writeDB(db);
    return res.json(p);
  }
  res.status(404).json({ message: 'Playlist not found' });
});

module.exports = router;
