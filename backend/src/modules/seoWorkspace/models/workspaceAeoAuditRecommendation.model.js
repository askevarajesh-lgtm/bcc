const mongoose = require('mongoose');

const WorkspaceAeoAuditRecommendationSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAudit', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  category: { 
    type: String, 
    enum: ['Technical', 'Content', 'Schema', 'Metadata', 'Internal Linking', 'Entities', 'EEAT'],
    required: true
  },
  
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  impact: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  difficulty: { type: String, enum: ['Hard', 'Medium', 'Easy'], required: true },
  
  estimatedEffort: { type: String, default: '' }, // e.g., "2 hours"
  
  affectedPage: { type: String, default: null }, // Optional, could be site-wide
  suggestedFix: { type: String, required: true },
  reference: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Task Created', 'In Progress', 'Completed', 'Ignored', 'Archived'], 
    default: 'Pending' 
  },
  
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask', default: null }
}, { timestamps: true });

WorkspaceAeoAuditRecommendationSchema.index({ auditId: 1, category: 1 });
WorkspaceAeoAuditRecommendationSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('WorkspaceAeoAuditRecommendation', WorkspaceAeoAuditRecommendationSchema, 'workspace_aeo_audit_recommendations');
