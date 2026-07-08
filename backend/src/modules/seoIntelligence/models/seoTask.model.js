const mongoose = require('mongoose');

const SeoTaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeoWebsite', // Changed from SeoProject
    required: true
  },
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeoStrategy',
    required: false
  },
  pageUrl: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    enum: ['Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  proposedChanges: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Implemented', 'Failed'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('SeoTask', SeoTaskSchema);
