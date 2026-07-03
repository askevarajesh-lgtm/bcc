const mongoose = require('mongoose');

const deliverableFileSchema = new mongoose.Schema({
  deliverableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  fileType: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DeliverableFile', deliverableFileSchema);
