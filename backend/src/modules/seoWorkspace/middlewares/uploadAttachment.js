const multer = require('multer');
const os = require('os');
const path = require('path');
const cloudinary = require('../../../config/cloudinary');

// Attachments can be any file type (PDFs, docs, images, etc.), unlike the
// existing image-only `middlewares/upload.js`. This mirrors the general-purpose
// diskStorage -> Cloudinary(resource_type: 'auto') pattern already used in
// campaignScheduled.routes.js instead of inventing a new upload approach.
const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB — attachments are docs/PDFs, not just images
});

/**
 * Express middleware: accepts a single `file` field via multer (temp disk),
 * uploads it to Cloudinary, then rewrites req.file.path to the hosted URL
 * so downstream controller code can treat it the same as the CloudinaryStorage
 * multer setup used elsewhere.
 */
function uploadAttachment(req, res, next) {
  diskUpload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) return next();

    try {
      let resource_type = 'auto';
      if (req.file.mimetype?.startsWith('image/')) resource_type = 'image';

      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type,
        folder: 'seo_workspace_attachments'
      });

      req.file.path = result.secure_url;
      next();
    } catch (uploadError) {
      console.error('Attachment upload to Cloudinary failed:', uploadError);
      res.status(500).json({ success: false, message: 'Failed to upload attachment.' });
    }
  });
}

module.exports = uploadAttachment;
