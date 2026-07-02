const mongoose = require('mongoose');

const IndustryBenchmarkSchema = new mongoose.Schema({
  industryName: { type: String, required: true, unique: true },
  avgMos: { type: Number, default: 0 },
  avgSeo: { type: Number, default: 0 },
  avgAds: { type: Number, default: 0 },
  avgSocial: { type: Number, default: 0 },
  avgLeads: { type: Number, default: 0 },
  avgContent: { type: Number, default: 0 },
  avgCx: { type: Number, default: 0 },
  historicalSnapshots: [{
     monthYear: String, // e.g., "2026-07"
     avgMos: Number,
     avgOrganicTraffic: Number // Just matching the frontend mock "Organic Traffic Growth"
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const ClientBenchmarkSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  industryName: { type: String, required: true },
  
  // Rankings (percentiles)
  percentiles: {
    mos: { type: Number, default: 0 },
    seo: { type: Number, default: 0 },
    ads: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    cx: { type: Number, default: 0 },
  },
  
  // Last calculated metrics
  metrics: {
    mos: { type: Number, default: 0 },
    seo: { type: Number, default: 0 },
    ads: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    cx: { type: Number, default: 0 },
  },

  historicalSnapshots: [{
    monthYear: String,
    mos: Number,
    organicTraffic: Number
  }],
  
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  IndustryBenchmark: mongoose.model('IndustryBenchmark', IndustryBenchmarkSchema),
  ClientBenchmark: mongoose.model('ClientBenchmark', ClientBenchmarkSchema)
};
