const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clicktube',
    resource_type: 'auto', // Required for video uploads
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'avi', 'mkv']
  }
});

const uploadCloud = multer({ storage });

module.exports = { cloudinary, uploadCloud };
