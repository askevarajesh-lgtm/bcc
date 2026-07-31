const mongoose = require('mongoose');

const workspaceCrawlQueueSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceCrawlJob', required: true, index: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true },
  retryCount: { type: Number, default: 0 },
  error: { type: String }
});

// Ensure uniqueness of URL per job so we don't enqueue the same page multiple times
workspaceCrawlQueueSchema.index({ jobId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceCrawlQueue', workspaceCrawlQueueSchema);
