const mongoose = require('mongoose');

const WorkspaceReportSnapshotSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReport', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  
  auditSnapshot: { type: mongoose.Schema.Types.Mixed },
  techSeoSnapshot: { type: mongoose.Schema.Types.Mixed },
  keywordSnapshot: { type: mongoose.Schema.Types.Mixed },
  contentSnapshot: { type: mongoose.Schema.Types.Mixed },
  performanceSnapshot: { type: mongoose.Schema.Types.Mixed },
  cwvSnapshot: { type: mongoose.Schema.Types.Mixed },
  backlinkSnapshot: { type: mongoose.Schema.Types.Mixed },
  aeoSnapshot: { type: mongoose.Schema.Types.Mixed },
  geoSnapshot: { type: mongoose.Schema.Types.Mixed },
  
}, { timestamps: true });

WorkspaceReportSnapshotSchema.index({ reportId: 1 });

module.exports = mongoose.model('WorkspaceReportSnapshot', WorkspaceReportSnapshotSchema, 'workspace_report_snapshots');
