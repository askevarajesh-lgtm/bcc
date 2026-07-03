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

module.exports = {
  uploadAnyFileToCloudinary
};
