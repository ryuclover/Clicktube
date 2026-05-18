const express = require('express');
const cors = require('cors');
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
app.use(mongoSanitize()); // Sanitize request data against MongoDB operator injection
app.use(compression()); // Compress all responses

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(cors({
  origin: [
    env.FRONTEND_URL,
    'https://clicktube-wine.vercel.app',
    'https://clicktubeapp.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' })); // Body parser, limiting data size

// Initialize MongoDB Connection
connectDB();

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
