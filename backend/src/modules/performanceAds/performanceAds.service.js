const mongoose = require('mongoose');
const PerformanceAd = require('./performanceAds.model');

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
  // Fetch real data from external sources here
  const data = getEmptyData();
  
  const dashboard = await PerformanceAd.findOneAndUpdate(
    { agency: agencyId },
    { ...data, lastSynced: new Date() },
    { new: true, upsert: true }
  );

  return dashboard;
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
