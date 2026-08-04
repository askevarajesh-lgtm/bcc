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
  let allDailyData = [];

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

      // Fetch Daily Insights for Graph (Last 30 Days)
      const dailyInsightsRes = await axios.get(`https://graph.facebook.com/v18.0/${actId}/insights`, {
        params: {
          access_token: accessToken,
          date_preset: 'last_30d',
          time_increment: 1,
          fields: 'spend,clicks,cpc'
        }
      });
      const dailyData = dailyInsightsRes.data.data || [];
      allDailyData = allDailyData.concat(dailyData);

      // Fetch Active Campaigns with AdSets and Ads
      const campaignsRes = await axios.get(`https://graph.facebook.com/v18.0/${actId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,daily_budget,lifetime_budget,insights{spend,cpc,cpm,ctr,reach,clicks},adsets{id,name,status,daily_budget,lifetime_budget,insights{spend,cpc,cpm,ctr,reach,clicks},ads{id,name,status,insights{spend,cpc,cpm,ctr,reach,clicks}}}',
          effective_status: ['ACTIVE']
        }
      });

      const campaigns = campaignsRes.data.data || [];
      campaigns.forEach(c => {
        const adSets = (c.adsets && c.adsets.data) ? c.adsets.data.map(adset => ({
          id: adset.id,
          name: adset.name,
          status: adset.status,
          budget: adset.daily_budget ? (parseInt(adset.daily_budget)/100) : (adset.lifetime_budget ? parseInt(adset.lifetime_budget)/100 : 0),
          insights: adset.insights && adset.insights.data[0] ? adset.insights.data[0] : null,
          ads: (adset.ads && adset.ads.data) ? adset.ads.data.map(ad => ({
            id: ad.id,
            name: ad.name,
            status: ad.status,
            insights: ad.insights && ad.insights.data[0] ? ad.insights.data[0] : null
          })) : []
        })) : [];

        liveCampaigns.push({
          id: c.id,
          campaign: c.name,
          platform: 'Meta',
          status: c.status,
          budget: c.daily_budget ? (parseInt(c.daily_budget)/100) : (c.lifetime_budget ? parseInt(c.lifetime_budget)/100 : 0),
          spend: c.insights && c.insights.data[0] ? parseFloat(c.insights.data[0].spend) : 0,
          progress: 100, // Assuming active
          leads: c.insights && c.insights.data[0] ? parseInt(c.insights.data[0].clicks || 0, 10) : 0,
          cpl: c.insights && c.insights.data[0] ? c.insights.data[0].cpc : '0',
          roas: '-',
          ctr: c.insights && c.insights.data[0] && c.insights.data[0].ctr ? c.insights.data[0].ctr : '-',
          adAccount: adAccount.name,
          objective: c.objective,
          insights: c.insights && c.insights.data[0] ? c.insights.data[0] : null,
          adSets
        });
      });
    }

    const data = getEmptyData();
    data.metrics.adSpendMTD = totalSpend;
    data.metrics.impressions = totalImpressions;
    data.metrics.totalLeads = totalClicks;
    data.metrics.costPerLead = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : 0;
    data.metrics.roas = 0; // Not fetching purchases for ROAS calculation yet
    data.activeCampaigns = liveCampaigns;
    
    if (totalSpend > 0) {
      data.spendByPlatform = [{ name: 'Meta', value: totalSpend, fill: '#1877F2' }];
    }

    if (allDailyData.length > 0) {
      const dailyMap = {};
      allDailyData.forEach(d => {
        if (!d.date_start) return;
        const dateStr = d.date_start;
        if (!dailyMap[dateStr]) {
          dailyMap[dateStr] = { day: dateStr.split('-').slice(1).join('/'), leads: 0, roas: 0, spend: 0 };
        }
        dailyMap[dateStr].spend += parseFloat(d.spend || 0);
        dailyMap[dateStr].leads += parseInt(d.clicks || 0, 10); 
      });
      data.dailyPerformance = Object.values(dailyMap).sort((a, b) => a.day.localeCompare(b.day));
    }

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
