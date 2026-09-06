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
  max: 500, // limit each IP to 500 requests per windowMs (video feeds are chatty)
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

const allowedOrigins = [
  env.FRONTEND_URL,
  'https://clicktube-wine.vercel.app',
  'https://clicktubeapp.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    // Allow exact matches + any Vercel preview deployment of this project
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
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

// Initialize MongoDB Connection
connectDB();

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
