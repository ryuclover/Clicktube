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
  params: async (req, file) => {
    // Dynamically set resource_type to prevent signature mismatches (Invalid Signature)
    // for videos vs. images
    const isVideo = file.mimetype.startsWith('video') || file.fieldname === 'video';
    return {
      folder: 'clicktube',
      resource_type: isVideo ? 'video' : 'image',
    };
  }
});

const uploadCloud = multer({ storage });

module.exports = { cloudinary, uploadCloud };
