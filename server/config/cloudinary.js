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
    return {
      folder: 'clicktube',
      resource_type: 'auto',
    };
  }
});

const uploadCloud = multer({ storage });

module.exports = { cloudinary, uploadCloud };
