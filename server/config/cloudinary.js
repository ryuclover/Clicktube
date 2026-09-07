const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Prefer the single CLOUDINARY_URL format when available.
// Fallback to the explicit credentials used by the current deployment.
if (process.env.CLOUDINARY_URL) {
  cloudinary.config(process.env.CLOUDINARY_URL);
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('Aviso: credenciais do Cloudinary ausentes — uploads de vídeo/imagem vão falhar até configurar CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.');
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: isVideo ? 'clicktube/videos' : 'clicktube/thumbnails',
      resource_type: isVideo ? 'video' : 'image',
      ...(isVideo ? {} : { transformation: [{ width: 1280, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] }),
    };
  }
});

const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const uploadCloud = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB per file (Render free + Cloudinary free friendly)
    files: 2, // video + thumbnail
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video' && VIDEO_MIMES.includes(file.mimetype)) return cb(null, true);
    if (file.fieldname === 'thumbnail' && IMAGE_MIMES.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Invalid file type for ${file.fieldname}: ${file.mimetype}`));
  },
});

module.exports = { cloudinary, uploadCloud };
