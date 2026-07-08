const mongoose = require('mongoose');

const SeoStrategySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeoWebsite', // Changed from SeoProject
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String, // Markdown string
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  dateGenerated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('SeoStrategy', SeoStrategySchema);
