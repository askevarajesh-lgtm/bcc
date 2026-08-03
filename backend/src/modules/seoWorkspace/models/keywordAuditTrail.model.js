const mongoose = require('mongoose');

const KeywordAuditTrailSchema = new mongoose.Schema({
  keywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceKeyword', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  
  keyword: { type: String, required: true },
  
  action: { 
    type: String, 
    enum: [
      'CREATED', 
      'UPDATED', 
      'DELETED', 
      'RANK_CHANGED', 
      'INTENT_CHANGED', 
      'CLUSTER_CHANGED',
      'OPPORTUNITY_CHANGED',
      'MANUAL_APPROVAL',
      'MANUAL_REJECTION',
      'PROVIDER_UPDATE',
      'DISCOVERY_UPDATE'
    ], 
    required: true 
  },
  
  source: { type: String, required: true }, // e.g. 'GSC', 'DataForSEO', 'Crawler', 'User', 'System'
  reason: { type: String }, // Explanation for the change
  
  previousValue: { type: mongoose.Schema.Types.Mixed }, // Can store an object or primitive
  newValue: { type: mongoose.Schema.Types.Mixed },
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // If changed by a user
  
}, { timestamps: true });

// Index for query performance in UI
KeywordAuditTrailSchema.index({ keywordId: 1, createdAt: -1 });

module.exports = mongoose.model('KeywordAuditTrail', KeywordAuditTrailSchema, 'keyword_audit_trails');
