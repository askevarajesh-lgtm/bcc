const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'agency_templates',
    resource_type: 'raw',
    format: 'zip',
    type: 'authenticated'
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /zip/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  
  // Checking mimetype as application/zip or application/x-zip-compressed
  const mimetype = file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/octet-stream';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('ZIP files only'));
  }
};

const zipUpload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for templates
  fileFilter: fileFilter
});

module.exports = zipUpload;
