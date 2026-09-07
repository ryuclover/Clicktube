const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const env = require('./config/env');
const logger = require('./utils/logger');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const socialRoutes = require('./routes/social');

const app = express();
app.set('trust proxy', 1);
const PORT = env.PORT || 5000;

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cookieParser()); // Parse httpOnly auth cookies
app.use(mongoSanitize()); // Sanitize request data against MongoDB operator injection
app.use(compression()); // Compress all responses

// Rate Limiting — P0: strict on auth, generous on reads
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (video feeds are chatty)
  message: { code: 'RATE_LIMITED', message: 'Too many requests from this IP, please try again after 15 minutes' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // login/register/refresh brute-force protection
  message: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later' }
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // video/avatar uploads per hour per IP
  message: { code: 'RATE_LIMITED', message: 'Upload limit reached, please try again later' }
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);
app.use('/api/videos/upload', uploadLimiter);
app.use('/api/auth/upload-avatar', uploadLimiter);

const allowedOrigins = [
  env.FRONTEND_URL,
  'https://clicktubeapp.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// P0: only exact origins + this project's Vercel previews (clicktube*.vercel.app)
const previewPattern = /^https:\/\/clicktube[a-z0-9-]*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || previewPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb' })); // Body parser, limiting data size

// Health checks — must stay up even if MongoDB/Cloudinary are misconfigured
// Render uses these to decide if the service is alive.
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'clicktube-api', time: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  const db = require('./config/db').getDbStatus();
  res.json({
    status: 'ok',
    db: db.state,
    dbDetail: db,
    time: new Date().toISOString()
  });
});
app.get('/api/health', (req, res) => {
  const db = require('./config/db').getDbStatus();
  res.json({
    status: 'ok',
    db: db.state,
    dbDetail: db,
    time: new Date().toISOString()
  });
});

// Lightweight keep-alive ping: touches the DB (prevents Atlas M0
// auto-pause from inactivity) and triggers a reconnect if down.
// Safe to be hit by an external cron every few hours.
app.get('/api/ping', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      await require('./config/db')(2);
    }
    if (mongoose.connection.readyState === 1) {
      const count = await require('./models/Video').countDocuments().maxTimeMS(8000);
      return res.json({ status: 'ok', db: 'connected', videos: count, time: new Date().toISOString() });
    }
    const db = require('./config/db').getDbStatus();
    return res.status(503).json({ status: 'degraded', db: 'disconnected', dbDetail: db, time: new Date().toISOString() });
  } catch (error) {
    return res.status(503).json({ status: 'degraded', message: error.message, time: new Date().toISOString() });
  }
});

// Initialize MongoDB Connection + self-healing keep-alive
connectDB();
require('./config/db').startKeepAlive();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/social', socialRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  logger.info(`Clicktube Backend running on port ${PORT}`);
});
