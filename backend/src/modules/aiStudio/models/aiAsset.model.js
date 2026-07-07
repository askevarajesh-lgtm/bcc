const mongoose = require('mongoose');

const AiAssetSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  format: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AiAsset', AiAssetSchema);
