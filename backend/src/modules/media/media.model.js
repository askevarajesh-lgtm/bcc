const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  format: {
    type: String,
  },
  size: {
    type: Number,
  },
  cloudinaryId: {
    type: String,
  },
  folder: {
    type: String,
    default: 'root'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
