const mongoose = require('mongoose');

// Cached Analytics Dashboard Document
const analyticsSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metrics: {
    totalSessions: { type: Number, default: 0 },
    totalLeads: { type: Number, default: 0 },
    blendedRoas: { type: String, default: '0x' },
    organicTrafficShare: { type: String, default: '0%' },
    totalAdSpend: { type: String, default: '₹0L' },
    sessionsTrend: { type: String, default: '0%' },
    leadsTrend: { type: String, default: '0%' },
    roasTrend: { type: String, default: '0' },
    organicTrend: { type: String, default: '0%' },
    spendTrend: { type: String, default: '0%' }
  },
  websiteTraffic: { type: Array, default: [] },
  leadsByChannel: { type: Array, default: [] },
  revenueAttribution: { type: Array, default: [] },
  clientPerformance: { type: Array, default: [] },
  topPages: { type: Array, default: [] },
  attributionPaths: { type: Array, default: [] },
  customerJourney: { type: Object, default: {} },
  channelBreakdown: { type: Array, default: [] },
  lastSynced: { type: Date, default: Date.now }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// Stand-in for CRM Leads since no dedicated collection was found
const analyticsLeadSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String }, // e.g. Meta Ads, Google Ads, Organic
  status: { type: String, default: 'New' },
  revenue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const AnalyticsLead = mongoose.model('AnalyticsLead', analyticsLeadSchema);

// Stand-in for Website Sessions since no dedicated collection was found
const websiteSessionSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String }, // e.g. Paid, Organic, Direct, Referral
  pageUrl: { type: String },
  bounce: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  converted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const WebsiteSession = mongoose.model('WebsiteSession', websiteSessionSchema);

module.exports = {
  Analytics,
  AnalyticsLead,
  WebsiteSession
};
