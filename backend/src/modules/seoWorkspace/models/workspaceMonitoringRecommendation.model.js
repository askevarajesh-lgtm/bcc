const mongoose = require('mongoose');

const WorkspaceMonitoringRecommendationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceMonitoringAlert', required: true, index: true },
  
  rootCause: { type: String, required: true },
  recommendation: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  
  status: { type: String, enum: ['Pending', 'Accepted', 'Ignored', 'Resolved'], default: 'Pending', index: true },
  
  // E.g., if a task is created from this recommendation
  linkedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask' },
  
  generatedBy: { type: String, default: 'ai' }, // e.g., 'ai' or 'rule-engine'
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceMonitoringRecommendation', WorkspaceMonitoringRecommendationSchema, 'workspace_monitoring_recommendations');
