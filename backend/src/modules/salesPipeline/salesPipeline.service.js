const Deal = require("./deal.model");
const mongoose = require("mongoose");

const createDeal = async (dealData, companyId, username) => {
  const deal = new Deal({
    ...dealData,
    companyId,
    activityLogs: [
      { action: "Deal Created", performedBy: username || "User", details: `Deal created with initial stage: ${dealData.stage || 'lead'}` }
    ]
  });
  return await deal.save();
};

const getAllDeals = async (companyId, query = {}) => {
  await Deal.deleteMany({ companyId, "activityLogs.action": "Deal Seeded" });
  const filter = { companyId };

  if (query.stage) filter.stage = query.stage;
  if (query.priority) filter.priority = query.priority;
  if (query.rep) filter.rep = { $regex: query.rep, $options: 'i' };
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { rep: { $regex: query.search, $options: 'i' } }
    ];
  }

  return await Deal.find(filter).sort({ createdAt: -1 });
};

const getDealById = async (id, companyId) => {
  const deal = await Deal.findOne({ _id: id, companyId });
  if (!deal) throw new Error("Deal not found");
  return deal;
};

const updateDeal = async (id, updateData, companyId, username) => {
  const deal = await Deal.findOne({ _id: id, companyId });
  if (!deal) throw new Error("Deal not found");

  const oldStage = deal.stage;
  Object.assign(deal, updateData);

  if (updateData.stage && updateData.stage !== oldStage) {
    deal.activityLogs.push({
      action: "Stage Changed",
      performedBy: username || "User",
      details: `Moved from '${oldStage}' to '${updateData.stage}'`
    });
  } else {
    deal.activityLogs.push({
      action: "Deal Updated",
      performedBy: username || "User",
      details: "Deal metadata modified"
    });
  }

  return await deal.save();
};

const deleteDeal = async (id, companyId) => {
  const res = await Deal.deleteOne({ _id: id, companyId });
  if (res.deletedCount === 0) throw new Error("Deal not found");
  return true;
};

const addDealNote = async (id, content, username, companyId) => {
  const deal = await Deal.findOne({ _id: id, companyId });
  if (!deal) throw new Error("Deal not found");

  deal.notes.push({ content, createdBy: username });
  deal.activityLogs.push({
    action: "Note Added",
    performedBy: username,
    details: content.substring(0, 60) + (content.length > 60 ? "..." : "")
  });

  return await deal.save();
};

const getPipelineAnalytics = async (companyId) => {
  await Deal.deleteMany({ companyId, "activityLogs.action": "Deal Seeded" });
  const deals = await Deal.find({ companyId });

  // Compute KPIs
  const openStages = ['lead', 'qualified', 'proposal', 'negotiation'];
  const openDeals = deals.filter(d => openStages.includes(d.stage));
  const wonDeals = deals.filter(d => d.stage === 'won');
  const lostDeals = deals.filter(d => d.stage === 'lost');

  const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineValue = openDeals.reduce((sum, d) => sum + (d.value * (d.probability || 0) / 100), 0);
  
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
  
  const avgDealSize = deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0;
  const activeProspects = openDeals.length;
  const proposalsSent = deals.filter(d => d.stage === 'proposal').length;

  // Conversion funnel counts
  const funnelStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];
  const funnel = funnelStages.map(stg => {
    const matched = deals.filter(d => d.stage === stg);
    return {
      stage: stg.toUpperCase(),
      count: matched.length,
      value: matched.reduce((sum, d) => sum + d.value, 0)
    };
  });

  // Top performers grouping by rep
  const repGroups = {};
  deals.forEach(d => {
    if (!repGroups[d.rep]) {
      repGroups[d.rep] = { rep: d.rep, ownerInit: d.ownerInit, valueWon: 0, countWon: 0, pipelineVal: 0, totalCount: 0 };
    }
    const group = repGroups[d.rep];
    group.totalCount += 1;
    if (d.stage === 'won') {
      group.valueWon += d.value;
      group.countWon += 1;
    } else if (openStages.includes(d.stage)) {
      group.pipelineVal += d.value;
    }
  });

  const leaderboard = Object.values(repGroups).map(g => ({
    ...g,
    winRate: g.totalCount > 0 ? Math.round((g.countWon / g.totalCount) * 100) : 0
  })).sort((a, b) => b.valueWon - a.valueWon);

  // Stalled Deal Detection: No activity in last 10 days
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const stalledDeals = deals.filter(d => openStages.includes(d.stage) && d.updatedAt < tenDaysAgo).map(d => ({
    _id: d._id,
    name: d.name,
    stage: d.stage,
    value: d.value,
    rep: d.rep,
    updatedAt: d.updatedAt
  }));

  return {
    kpis: {
      totalPipelineValue,
      weightedPipelineValue,
      winRate,
      avgDealSize,
      activeProspects,
      proposalsSent,
      dealsWonThisMonth: wonDeals.length,
      dealsLostThisMonth: lostDeals.length
    },
    funnel,
    leaderboard,
    stalledDeals
  };
};

module.exports = {
  createDeal,
  getAllDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  addDealNote,
  getPipelineAnalytics
};
