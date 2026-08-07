const mongoose = require('mongoose');

const mosConfigSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // The agency setting the weights
  weights: {
    website: { type: Number, default: 15 },
    seo: { type: Number, default: 25 },
    aeo: { type: Number, default: 10 },
    geo: { type: Number, default: 10 },
    social: { type: Number, default: 10 },
    ads: { type: Number, default: 15 },
    leads: { type: Number, default: 10 },
    revenue: { type: Number, default: 5 }, // total is 100
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const mosScoreHistorySchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // The Brand/Client
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Normalized raw scores (0-100)
  signals: {
    website: { type: Number, default: 0 },
    seo: { type: Number, default: 0 },
    aeo: { type: Number, default: 0 },
    geo: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    ads: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    cx: { type: Number, default: 0 }
  },
  
  // Weakest signals at this point in time
  weakestSignals: [{
    signalName: String,
    score: Number,
    priority: String,
    actions: [String],
    points: [String]
  }],

  // Final calculated MOS score
  overallMos: { type: Number, required: true },
  
  // Stored AI-generated Action Plan
  actionPlan: {
    prompt: String,
    content: String,
    generatedAt: Date
  },
  
  // e.g. "2026-06", useful for monthly aggregation without complex date math
  monthYear: { type: String, index: true }
}, {
  timestamps: true
});

module.exports = {
  MosConfig: mongoose.model('MosConfig', mosConfigSchema),
  MosScoreHistory: mongoose.model('MosScoreHistory', mosScoreHistorySchema)
};
