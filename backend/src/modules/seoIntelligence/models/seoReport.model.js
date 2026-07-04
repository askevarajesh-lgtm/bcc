const mongoose = require('mongoose');

const SeoReportSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeoProject', default: null }, // Optional, could be an overarching agency report
  
  name: { type: String, required: true },
  type: { type: String, enum: ['keyword_rankings', 'site_audit', 'backlinks', 'competitor_gap', 'comprehensive'], required: true },
  
  format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
  
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  
  downloadUrl: { type: String, default: null },
  
  isScheduled: { type: Boolean, default: false },
  scheduleFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
  emailRecipients: [{ type: String }],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

SeoReportSchema.index({ agencyId: 1, createdAt: -1 });

module.exports = mongoose.model('SeoReport', SeoReportSchema);
