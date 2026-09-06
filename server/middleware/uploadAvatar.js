const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

// Configure Cloudinary (supports CLOUDINARY_URL or split credentials)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config(process.env.CLOUDINARY_URL);
} else {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

// Set up CloudinaryStorage for avatars
const uploadAvatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clicktube/avatars',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});

// Multer middleware for avatar uploads (limit to 5MB)
const uploadAvatar = multer({
  storage: uploadAvatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  }
});

module.exports = uploadAvatar;
