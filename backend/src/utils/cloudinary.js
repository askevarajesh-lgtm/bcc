const cloudinary = require('../config/cloudinary');

async function uploadAnyFileToCloudinary(filePath, folder = "general", _options, extra = {}) {
  let resource_type = "auto";
  if (extra.mimetype && extra.mimetype.startsWith("video/")) {
    resource_type = "video";
  } else if (extra.mimetype && extra.mimetype.startsWith("image/")) {
    resource_type = "image";
  }
  return await cloudinary.uploader.upload(filePath, { resource_type, folder });
}

async function uploadBufferToCloudinary(buffer, folder = "general", publicId, extra = {}) {
  let resource_type = "auto";
  if (extra.mimetype && extra.mimetype.startsWith("video/")) {
    resource_type = "video";
  } else if (extra.mimetype && extra.mimetype.startsWith("image/")) {
    resource_type = "image";
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type, folder, public_id: publicId },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

module.exports = {
  uploadAnyFileToCloudinary,
  uploadBufferToCloudinary
};
