const mongoose = require('mongoose');

const workspaceCrawlJobSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: String, required: true },
  status: { type: String, enum: ['queued', 'running', 'paused', 'completed', 'failed'], default: 'queued' },
  progress: {
    pagesCrawled: { type: Number, default: 0 },
    keywordsExtracted: { type: Number, default: 0 },
    duplicatesRemoved: { type: Number, default: 0 },
    keywordsSaved: { type: Number, default: 0 }
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceCrawlJob', workspaceCrawlJobSchema);
