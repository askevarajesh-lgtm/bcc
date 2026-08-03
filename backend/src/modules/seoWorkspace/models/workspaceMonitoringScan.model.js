const mongoose = require('mongoose');

const WorkspaceMonitoringScanSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  scanId: { type: String, required: true, unique: true, index: true }, // e.g., 'scan-1691234567'
  
  status: { 
    type: String, 
    enum: ['Queued', 'Running', 'Paused', 'Completed', 'Failed', 'Cancelled', 'Retrying'], 
    default: 'Queued',
    index: true 
  },
  
  startedAt: { type: Date },
  finishedAt: { type: Date },
  durationMs: { type: Number },
  
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  worker: { type: String }, // e.g., 'node-1'
  error: { type: String }, // If failed
  
  // High-level summary of what was done
  resultsSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceMonitoringScan', WorkspaceMonitoringScanSchema, 'workspace_monitoring_scans');
