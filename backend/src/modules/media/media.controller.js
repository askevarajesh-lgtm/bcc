const Media = require('./media.model');
const cloudinary = require('../../config/cloudinary');

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { workspaceId } = req;
    const { folder = 'root' } = req.body;

    // multer-storage-cloudinary already uploaded the file to Cloudinary
    // req.file.path contains the secure URL
    // req.file.filename contains the public_id
    // req.file.size might be undefined depending on the multer-storage-cloudinary version, but we can save what we have.

    const newMedia = new Media({
      workspaceId,
      url: req.file.path,
      filename: req.file.originalname || 'uploaded_image',
      format: req.file.mimetype ? req.file.mimetype.split('/')[1] : 'unknown',
      size: req.file.size || 0,
      cloudinaryId: req.file.filename,
      folder
    });

    await newMedia.save();

    res.status(201).json({
      success: true,
      data: newMedia
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkspaceMedia = async (req, res, next) => {
  try {
    const { workspaceId } = req;
    const { folder } = req.query;

    const query = { workspaceId, isDeleted: false };
    if (folder) query.folder = folder;

    const media = await Media.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: media
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    const media = await Media.findOne({ _id: id, workspaceId });
    if (!media) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }

    if (media.cloudinaryId) {
      await cloudinary.uploader.destroy(media.cloudinaryId);
    }

    media.isDeleted = true;
    await media.save();

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
