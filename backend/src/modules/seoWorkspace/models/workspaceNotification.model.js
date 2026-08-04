// const mongoose = require('mongoose');

// const WorkspaceNotificationSchema = new mongoose.Schema({
//   projectId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'WorkspaceProject',
//     required: true,
//     index: true
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null,
//     index: true
//   },
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   severity: {
//     type: String,
//     enum: ['critical', 'warning', 'info', 'success'],
//     default: 'info',
//     index: true
//   },
//   category: {
//     type: String,
//     enum: ['automation', 'monitoring', 'audit', 'ranking', 'backlink', 'system', 'digest'],
//     default: 'automation',
//     index: true
//   },
//   isRead: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   readAt: {
//     type: Date,
//     default: null
//   },
//   deliveryLogs: [{
//     channel: {
//       type: String,
//       enum: ['in_app', 'email', 'slack', 'teams', 'discord', 'telegram', 'webhook'],
//       required: true
//     },
//     status: {
//       type: String,
//       enum: ['sent', 'failed', 'delivered', 'skipped'],
//       default: 'sent'
//     },
//     deliveredAt: {
//       type: Date,
//       default: Date.now
//     },
//     error: {
//       type: String,
//       default: null
//     }
//   }],
//   actionUrl: {
//     type: String,
//     default: null
//   },
//   metadata: {
//     workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationWorkflow', default: null },
//     runId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationExecutionRun', default: null },
//     alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceMonitoringAlert', default: null },
//     taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceTask', default: null },
//     digestType: { type: String, default: null },
//     extra: { type: mongoose.Schema.Types.Mixed, default: {} }
//   }
// }, {
//   timestamps: true
// });

// WorkspaceNotificationSchema.index({ projectId: 1, isRead: 1, createdAt: -1 });
// WorkspaceNotificationSchema.index({ userId: 1, isRead: 1 });

// module.exports = mongoose.model('WorkspaceNotification', WorkspaceNotificationSchema);
