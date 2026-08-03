const mongoose = require('mongoose');

const ProviderUsageSchema = new mongoose.Schema({
  providerName: { type: String, required: true, enum: ['DataForSEO', 'GoogleSearchConsole', 'Other'], index: true },
  
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', index: true, default: null },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
  
  date: { type: Date, required: true, index: true },
  
  endpoint: { type: String, required: true }, // e.g., 'v3/serp/google/organic/live/advanced'
  
  status: { type: String, enum: ['SUCCESS', 'TIMEOUT', 'RATE_LIMIT', 'ERROR'], required: true },
  
  responseTimeMs: { type: Number, default: 0 },
  retryCount: { type: Number, default: 0 },
  
  creditsUsed: { type: Number, default: 0 },
  remainingCredits: { type: Number, default: null }, // Optional, some providers don't give remaining credits easily
  
  errorMessage: { type: String, default: null },
  
}, { timestamps: true });

// Ensure we can query daily usage effectively
ProviderUsageSchema.index({ providerName: 1, date: 1, agencyId: 1 });

module.exports = mongoose.model('ProviderUsage', ProviderUsageSchema, 'provider_usage_logs');
