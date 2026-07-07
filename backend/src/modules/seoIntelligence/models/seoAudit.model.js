const mongoose = require('mongoose');

const SeoAuditSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeoProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  taskId: { type: String, required: true }, // DataForSEO task ID
  
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
  
  // High-level scores
  metrics: {
    onpageScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    pagesCrawled: { type: Number, default: 0 },
    pagesWithErrors: { type: Number, default: 0 },
    pagesWithWarnings: { type: Number, default: 0 }
  },

  // Breakdown of issues
  issues: {
    brokenLinks: { type: Number, default: 0 },
    duplicateContent: { type: Number, default: 0 },
    missingMeta: { type: Number, default: 0 },
    slowPages: { type: Number, default: 0 },
    canonicalIssues: { type: Number, default: 0 },
    sslIssues: { type: Number, default: 0 }
  },

  // We can store a detailed JSON dump of the crawl if needed, or rely on fetching from DataForSEO API via taskId
  rawResponseUrl: { type: String, default: null }, // S3 link or similar if we cache the full JSON payload
  
  completedAt: { type: Date, default: null },
}, { timestamps: true });

SeoAuditSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('SeoAudit', SeoAuditSchema);
