const mongoose = require('mongoose');
const { Analytics, AnalyticsLead, WebsiteSession } = require('./analytics.model');
const PerformanceAd = require('../performanceAds/performanceAds.model');
const Invoice = require('../invoices/invoice.model');
const User = require('../auth/user.model');

// Helper to generate realistic dummy data based on DB inputs if real records are extremely sparse
const getEmptyAnalyticsData = () => {
  return {
    metrics: {
      totalSessions: 0,
      sessionsTrend: '+0%',
      totalLeads: 0,
      leadsTrend: '+0%',
      blendedRoas: '0x',
      roasTrend: '+0.0',
      organicTrafficShare: '0%',
      organicTrend: '+0%',
      totalAdSpend: '₹0L',
      spendTrend: '-0%'
    },
    revenueAttribution: [
      { name: 'Google Ads', val: 0, fill: 'var(--accent-info)' },
      { name: 'Meta Ads', val: 0, fill: 'var(--accent-secondary)' },
      { name: 'Organic', val: 0, fill: 'var(--accent-primary)' },
      { name: 'WhatsApp', val: 0, fill: 'var(--accent-warning)' },
    ],
    clientPerformance: [],
    topPages: [],
    attributionPaths: [],
    customerJourney: {
      organic: 0, googleAds: 0, metaAds: 0, whatsapp: 0, direct: 0,
      landingPage: 0, blog: 0, productPage: 0, retargetingAd: 0,
      leadCaptured: 0, formSubmit: 0, call: 0, whatsappInquiry: 0
    },
    channelBreakdown: [
      { key: '1', channel: 'Google Ads', touchpoints: '0', assisted: '0', direct: '0', revenue: '₹0L', cost: '₹0L', roas: '0x', cpa: '₹0' },
      { key: '2', channel: 'Meta Ads', touchpoints: '0', assisted: '0', direct: '0', revenue: '₹0L', cost: '₹0L', roas: '0x', cpa: '₹0' },
      { key: '3', channel: 'Organic SEO', touchpoints: '0', assisted: '0', direct: '0', revenue: '₹0L', cost: '₹0', roas: '∞', cpa: '₹0' },
      { key: '4', channel: 'WhatsApp', touchpoints: '0', assisted: '0', direct: '0', revenue: '₹0L', cost: '₹0L', roas: '0x', cpa: '₹0' },
      { key: '5', channel: 'Direct/Referral', touchpoints: '0', assisted: '0', direct: '0', revenue: '₹0L', cost: '₹0', roas: '∞', cpa: '₹0' },
    ]
  };
};

const getAnalyticsDashboard = async (agencyId, clientId, dateRange) => {
  const matchObj = { agency: agencyId };
  if (clientId && clientId !== 'All Clients') {
    matchObj.client = clientId;
  }
  
  let analyticsRecord = await Analytics.findOne(matchObj);
  
  if (!analyticsRecord) {
    // Return empty state if absolutely zero records, but ideally compute
    const emptyData = getEmptyAnalyticsData();
    analyticsRecord = new Analytics({
      agency: agencyId,
      client: clientId && clientId !== 'All Clients' ? clientId : undefined,
      ...emptyData
    });
  }

  // --- DETERMINISTIC CALCULATION (AGGREGATION) ---
  // In a real robust system we'd aggregate over dateRange.
  // Here we'll do an aggregate of existing `AnalyticsLead`, `WebsiteSession`, `PerformanceAd`, `Invoice`
  
  // 1. Leads
  const leads = await AnalyticsLead.find(matchObj);
  const totalLeads = leads.length;

  // 2. Website Sessions
  const sessions = await WebsiteSession.find(matchObj);
  const totalSessions = sessions.length;

  // 3. Performance Ads
  // Performance ads model uses 'agency' string or ObjectId
  const perfAds = await PerformanceAd.findOne({ agency: agencyId });
  let totalAdSpendVal = 0;
  if (perfAds && perfAds.activeCampaigns) {
    perfAds.activeCampaigns.forEach(c => {
      const spendNum = parseFloat(c.spend.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(spendNum)) {
        totalAdSpendVal += spendNum; // assuming spend is in Rupees
      }
    });
  }

  // Generate data based on real records if any exist, otherwise populate some zeroed logic
  // For the sake of matching the frontend visualization shape exactly:
  
  analyticsRecord.metrics = {
    totalSessions: totalSessions || 0,
    sessionsTrend: '+0%',
    totalLeads: totalLeads || 0,
    leadsTrend: '+0%',
    blendedRoas: '0x',
    roasTrend: '+0.0',
    organicTrafficShare: '0%',
    organicTrend: '+0%',
    totalAdSpend: `₹${(totalAdSpendVal / 100000).toFixed(2)}L`,
    spendTrend: '-0%'
  };

  // Populate empty arrays for charts to avoid breaking frontend
  const emptyData = getEmptyAnalyticsData();
  analyticsRecord.websiteTraffic = emptyData.websiteTraffic;
  analyticsRecord.leadsByChannel = emptyData.leadsByChannel;
  analyticsRecord.revenueAttribution = emptyData.revenueAttribution;
  analyticsRecord.clientPerformance = emptyData.clientPerformance;
  analyticsRecord.topPages = emptyData.topPages;
  analyticsRecord.attributionPaths = emptyData.attributionPaths;
  analyticsRecord.channelBreakdown = emptyData.channelBreakdown;
  analyticsRecord.customerJourney = emptyData.customerJourney;

  await analyticsRecord.save();
  return analyticsRecord;
};

module.exports = {
  getAnalyticsDashboard
};
