const mongoose = require('mongoose');

const WorkspaceReportExportSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceReport', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  format: { type: String, enum: ['pdf', 'html', 'markdown', 'json', 'csv', 'docx'], required: true },
  fileUrl: { type: String }, // Path or S3 URL
  fileSize: { type: Number },
  
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
  failureReason: { type: String },
  
  downloads: { type: Number, default: 0 }
}, { timestamps: true });

WorkspaceReportExportSchema.index({ reportId: 1, format: 1 });

module.exports = mongoose.model('WorkspaceReportExport', WorkspaceReportExportSchema, 'workspace_report_exports');
