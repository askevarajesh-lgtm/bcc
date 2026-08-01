const mongoose = require('mongoose');
const PerformanceAd = require('./performanceAds.model');
const Integration = require('../integrations/integration.model');
const axios = require('axios');

// Empty structure to replace mock data for future API integrations
const getEmptyData = () => {
  return {
    metrics: {
      adSpendMTD: 0,
      adSpendPercentage: 0,
      totalLeads: 0,
      leadsChange: '0%',
      costPerLead: 0,
      roas: 0,
      roasChange: '0',
      impressions: 0,
      impressionsChange: '0%'
    },
    activeCampaigns: [],
    dailyPerformance: [],
    spendByPlatform: [],
    cplByPlatform: []
  };
};

const getPerformanceAdsDashboard = async (agencyId) => {
  let dashboard = await PerformanceAd.findOne({ agency: agencyId });

  if (!dashboard) {
    // Perform initial initialization if not exists
    const data = getEmptyData();
    dashboard = new PerformanceAd({
      agency: agencyId,
      ...data
    });
    await dashboard.save();
  }

  return dashboard;
};

const syncPerformanceAds = async (agencyId) => {
  // 1. Check for Meta Integration
  const integration = await Integration.findOne({ companyId: agencyId, type: 'meta_ads', isActive: true });
  
  if (!integration || !integration.config || !integration.config.accessToken) {
    // If not connected, just return what we have (or empty)
    const data = getEmptyData();
    const dashboard = await PerformanceAd.findOneAndUpdate(
      { agency: agencyId },
      { ...data, lastSynced: new Date() },
      { returnDocument: 'after', upsert: true }
    );
    return dashboard;
  }

  const { accessToken, selectedAdAccounts } = integration.config;
  if (!selectedAdAccounts || selectedAdAccounts.length === 0) {
    return await PerformanceAd.findOne({ agency: agencyId }); // Need an ad account selected to fetch data
  }

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  
  let liveCampaigns = [];

  // Loop through selected Ad Accounts to fetch insights and campaigns
  try {
    for (const adAccount of selectedAdAccounts) {
      const actId = adAccount.id;

      // Fetch Insights (Last 30 Days)
      const insightsRes = await axios.get(`https://graph.facebook.com/v18.0/${actId}/insights`, {
        params: {
          access_token: accessToken,
          date_preset: 'last_30d',
          fields: 'spend,impressions,clicks,cpm,cpc'
        }
      });

      const insights = insightsRes.data.data[0];
      if (insights) {
        totalSpend += parseFloat(insights.spend || 0);
        totalImpressions += parseInt(insights.impressions || 0, 10);
        totalClicks += parseInt(insights.clicks || 0, 10);
      }

      // Fetch Active Campaigns
      const campaignsRes = await axios.get(`https://graph.facebook.com/v18.0/${actId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,daily_budget,lifetime_budget,insights{spend,cpc}',
          effective_status: ['ACTIVE']
        }
      });

      const campaigns = campaignsRes.data.data || [];
      campaigns.forEach(c => {
        liveCampaigns.push({
          id: c.id,
          campaign: c.name,
          platform: 'Meta',
          status: c.status,
          budget: c.daily_budget ? (parseInt(c.daily_budget)/100) : (c.lifetime_budget ? parseInt(c.lifetime_budget)/100 : 0),
          spend: c.insights && c.insights.data[0] ? parseFloat(c.insights.data[0].spend) : 0,
          progress: 100, // Assuming active
          leads: 0, // Would need to parse action stats
          cpl: c.insights && c.insights.data[0] ? c.insights.data[0].cpc : '0',
          roas: '-',
          ctr: '-',
          adAccount: adAccount.name,
          objective: c.objective
        });
      });
    }

    const data = getEmptyData();
    data.metrics.adSpendMTD = totalSpend;
    data.metrics.impressions = totalImpressions;
    data.activeCampaigns = liveCampaigns;

    const dashboard = await PerformanceAd.findOneAndUpdate(
      { agency: agencyId },
      { ...data, lastSynced: new Date() },
      { returnDocument: 'after', upsert: true }
    );
    return dashboard;
  } catch (error) {
    console.error("Meta Sync Error: ", error.response?.data || error.message);
    throw new Error('Failed to sync data from Meta');
  }
};

const addCampaign = async (agencyId, campaignData) => {
  let dashboard = await PerformanceAd.findOne({ agency: agencyId });
  if (!dashboard) {
    dashboard = new PerformanceAd({
      agency: agencyId,
      ...getEmptyData()
    });
  }

  const newCampaign = {
    id: new mongoose.Types.ObjectId().toString(),
    campaign: campaignData.campaign,
    platform: campaignData.platform,
    status: campaignData.status,
    budget: campaignData.budget,
    spend: '₹0',
    progress: 0,
    leads: 0,
    cpl: '₹0',
    roas: '-',
    ctr: '0%',
    adAccount: campaignData.adAccount,
    objective: campaignData.objective,
    specialAdCategory: campaignData.specialAdCategory,
    buyingType: campaignData.buyingType,
    budgetType: campaignData.budgetType
  };

  dashboard.activeCampaigns.push(newCampaign);
  await dashboard.save();
  return dashboard;
};

module.exports = {
  getPerformanceAdsDashboard,
  syncPerformanceAds,
  addCampaign
};
