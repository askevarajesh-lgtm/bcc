const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'website_builder_templates',
    resource_type: 'raw',
    format: 'zip',
    type: 'authenticated', // required so it can be fetched back later via a signed private_download_url — this Cloudinary account blocks public/unsigned delivery of zip/raw files (see website.controller.js's downloadTemplateZip)
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