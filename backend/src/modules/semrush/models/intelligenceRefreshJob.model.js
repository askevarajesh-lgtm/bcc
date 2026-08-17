const mongoose = require('mongoose');

const IntelligenceRefreshJobSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SemrushProject', required: true, index: true },
  database: { type: String, default: 'us' },
  
  status: { 
    type: String, 
    enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED'], 
    default: 'QUEUED',
    index: true
  },
  
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  
  lockedAt: { type: Date, default: null },
  lockedBy: { type: String, default: null }, // e.g., worker ID or hostname
  
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  lastHeartbeatAt: { type: Date, default: null },
  
  error: { type: String, default: null }
}, { timestamps: true });

// Partial unique index to enforce only one active job per project
IntelligenceRefreshJobSchema.index(
  { companyId: 1, projectId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: { $in: ['QUEUED', 'RUNNING'] } },
    name: 'unique_active_job_per_project'
  }
);

module.exports = mongoose.model('IntelligenceRefreshJob', IntelligenceRefreshJobSchema, 'intelligencerefreshjobs');
