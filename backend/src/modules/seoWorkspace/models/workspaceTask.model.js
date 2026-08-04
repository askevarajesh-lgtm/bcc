// const mongoose = require('mongoose');

// const WorkspaceTaskSchema = new mongoose.Schema({
//   projectId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'WorkspaceProject',
//     required: true
//   },
//   strategyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'WorkspaceStrategy',
//     required: false
//   },
//   pageUrl: {
//     type: String,
//     required: true
//   },
//   taskType: {
//     type: String,
//     enum: [
//       'Update Meta Tags', 'Content Edit', 'Schema Injection', 'Create Redirect', 'Internal Linking', 'Image Optimization', 'AEO Optimization',
//       'Target New Keyword', 'Close Content Gap', 'Build Backlink', 'Close Page Gap'
//     ],
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   proposedChanges: {
//     type: mongoose.Schema.Types.Mixed,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['Pending', 'Approved', 'Rejected', 'Implemented', 'Failed'],
//     default: 'Pending'
//   },
//   failureReason: {
//     type: String,
//     default: null
//   },
//   source: { type: String, enum: ['manual', 'monitoring-agent', 'automation-agent', 'competitor-intelligence-agent'], default: 'manual' },
//   generatedFix: {
//     type: mongoose.Schema.Types.Mixed,
//     default: null
//   },
//   verification: {
//     status: {
//       type: String,
//       enum: ['Not Verified', 'Pending Verification', 'Verified', 'Failed', 'Inconclusive'],
//       default: 'Not Verified'
//     },
//     method: { type: String, default: null }, // which verifier function ran
//     checkedAt: { type: Date, default: null },
//     details: { type: String, default: '' }
//   },
//   agent: {
//     agentKey: { type: String, default: null }, 
//     sourceKeywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceKeyword', default: null },
//     dropAmount: { type: Number, default: null },
//     rationale: { type: String, default: null },
//     recommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation', default: null },
//     estimatedEffort: { type: String, enum: ['low', 'medium', 'high', null], default: null },
//     estimatedImpact: { type: Number, default: null }
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('WorkspaceTask', WorkspaceTaskSchema, 'workspace_tasks');