const express = require('express');
const cors = require('cors');
const path = require('path');
const { readDB } = require('./db');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const socialRoutes = require('./routes/social');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize DB if not exists
readDB();

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/social', socialRoutes);

app.listen(PORT, () => {
  console.log(`Clicktube Local Backend running on http://localhost:${PORT}`);
});
