const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname === 'video' ? 'videos' : 'thumbnails';
    cb(null, path.join(__dirname, `../uploads/${type}`));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Get videos with filtering and sorting
router.get('/', (req, res) => {
  const { category, sort, search, status, userId } = req.query;
  const db = readDB();
  let videos = [...db.videos];

  // Filter by status (default public)
  if (status) {
    videos = videos.filter(v => v.status === status);
  } else if (userId) {
    // If userId provided, show all their videos (including private/draft)
    videos = videos.filter(v => v.userId === userId);
  } else {
    // Public view: only show public videos
    videos = videos.filter(v => v.status === 'public' || !v.status);
  }

  // Filter by category
  if (category && category !== 'All') {
    videos = videos.filter(v => v.category === category);
  }

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    videos = videos.filter(v => 
      v.title.toLowerCase().includes(q) || 
      v.description.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'newest') {
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'views') {
    videos.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  }

  res.json(videos);
});

// Increment views
router.post('/:id/view', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const videoIndex = db.videos.findIndex(v => v.id === id);
  
  if (videoIndex !== -1) {
    db.videos[videoIndex].viewsCount = (db.videos[videoIndex].viewsCount || 0) + 1;
    // Keep the display string updated too for legacy compatibility
    db.videos[videoIndex].views = `${db.videos[videoIndex].viewsCount} views`;
    writeDB(db);
    return res.json({ success: true, views: db.videos[videoIndex].viewsCount });
  }
  
  res.status(404).json({ message: 'Video not found' });
});

router.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
  const { title, description, category, userId, status, duration } = req.body;
  const db = readDB();
  
  const videoFile = req.files['video'][0];
  const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

  const user = db.users.find(u => u.id === userId);

  const newVideo = {
    id: uuidv4(),
    title,
    description,
    category,
    status: status || 'public',
    duration: duration || '0:00',
    url: `/uploads/videos/${videoFile.filename}`,
    thumbnail: thumbnailFile ? `/uploads/thumbnails/${thumbnailFile.filename}` : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
    userId,
    channel: user ? user.username : 'Unknown',
    channelAvatar: user ? user.avatar : 'https://i.pravatar.cc/150',
    viewsCount: 0,
    views: '0 views',
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0
  };

  db.videos.push(newVideo);
  writeDB(db);

  res.status(201).json(newVideo);
});

// Delete video
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { userId, adminOverride } = req.query; // Simple security: check if requester is owner or admin
  const db = readDB();
  
  const videoIndex = db.videos.findIndex(v => v.id === id);
  if (videoIndex === -1) return res.status(404).json({ message: 'Video not found' });
  
  if (db.videos[videoIndex].userId !== userId && adminOverride !== 'true') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  db.videos.splice(videoIndex, 1);
  writeDB(db);
  res.json({ success: true });
});


// Update video (Edit)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category, status, userId } = req.body;
  const db = readDB();

  const videoIndex = db.videos.findIndex(v => v.id === id);
  if (videoIndex === -1) return res.status(404).json({ message: 'Video not found' });

  if (db.videos[videoIndex].userId !== userId) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  db.videos[videoIndex] = {
    ...db.videos[videoIndex],
    title: title || db.videos[videoIndex].title,
    description: description || db.videos[videoIndex].description,
    category: category || db.videos[videoIndex].category,
    status: status || db.videos[videoIndex].status,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json(db.videos[videoIndex]);
});

module.exports = router;
