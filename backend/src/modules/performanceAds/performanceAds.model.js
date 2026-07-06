const mongoose = require('mongoose');

const performanceAdsSchema = new mongoose.Schema(
  {
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
      unique: true // One performance ads dashboard cache per agency
    },
    metrics: {
      adSpendMTD: { type: Number, default: 0 },
      adSpendPercentage: { type: Number, default: 0 },
      totalLeads: { type: Number, default: 0 },
      leadsChange: { type: String, default: '0%' },
      costPerLead: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      roasChange: { type: String, default: '0' },
      impressions: { type: Number, default: 0 },
      impressionsChange: { type: String, default: '0%' }
    },
    activeCampaigns: [
      {
        id: String,
        campaign: String,
        platform: { type: String, enum: ['Meta', 'Google', 'YouTube'] },
        status: { type: String, enum: ['Active', 'Paused', 'Completed', 'ACTIVE', 'PAUSED', 'COMPLETED'] },
        budget: String,
        spend: String,
        progress: Number,
        leads: Number,
        cpl: String,
        roas: String,
        ctr: String,
        adAccount: String,
        objective: String,
        specialAdCategory: String,
        buyingType: String,
        budgetType: String
      }
    ],
    dailyPerformance: [
      {
        day: Number,
        leads: Number,
        roas: Number,
        spend: Number
      }
    ],
    spendByPlatform: [
      {
        name: { type: String, enum: ['Meta', 'Google', 'YouTube'] },
        value: Number,
        fill: String,
        formattedValue: String
      }
    ],
    cplByPlatform: [
      {
        name: { type: String, enum: ['Meta', 'Google', 'YouTube'] },
        cpl: Number,
        fill: String
      }
    ],
    lastSynced: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerformanceAd', performanceAdsSchema);
