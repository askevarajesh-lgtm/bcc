const mongoose = require('mongoose');

const AnalyticsProjectSchema = new mongoose.Schema({
  // CRM tenant fields
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Website identity
  domain: { type: String, required: true, trim: true, index: true },
  name:   { type: String, required: true },

  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  // Credentials for external integrations
  credentials: {
    gscServiceAccount: { type: String },
    ga4PropertyId: { type: String }
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AnalyticsProjectSchema.index({ companyId: 1, clientId: 1, isDeleted: 1 });
AnalyticsProjectSchema.index({ domain: 1, companyId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsProject', AnalyticsProjectSchema, 'analytics_projects');
