
const mongoose = require('mongoose');
const Lead = require('../../leads/lead.model');
const Invoice = require('../../invoices/invoice.model');
const { normalizeChannel } = require('../utils/channelBucket');

const toObjectId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

async function getLeadMetrics({ companyId, clientId, start, end }) {
  const match = {
    companyId: toObjectId(companyId),
    createdAt: { $gte: start, $lt: end }
  };
  const clientObjectId = toObjectId(clientId);
  if (clientObjectId) match.clientId = clientObjectId;

  const [totalResult, bySource] = await Promise.all([
    Lead.countDocuments(match),
    Lead.aggregate([
      { $match: match },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ])
  ]);

  const channelCounts = new Map();
  for (const row of bySource) {
    const channel = normalizeChannel(row._id);
    channelCounts.set(channel, (channelCounts.get(channel) || 0) + row.count);
  }

  return {
    totalLeads: totalResult,
    leadsByChannel: Array.from(channelCounts.entries()).map(([channel, count]) => ({ channel, leads: count }))
  };
}

async function getRevenueMetrics({ agencyId, clientId, start, end }) {
  const match = {
    agencyId: toObjectId(agencyId),
    isDeleted: { $ne: true },
    createdAt: { $gte: start, $lt: end }
  };
  const clientObjectId = toObjectId(clientId);
  if (clientObjectId) match.clientId = clientObjectId;

  const [result] = await Invoice.aggregate([
    { $match: match },
    { $group: { _id: null, revenue: { $sum: '$grandTotal' }, collected: { $sum: '$totalPaid' }, invoiceCount: { $sum: 1 } } }
  ]);

  return {
    revenue: result?.revenue || 0,
    collectedRevenue: result?.collected || 0,
    invoiceCount: result?.invoiceCount || 0
  };
}

async function getLeadsForAttribution({ companyId, clientId, start, end, limit = 10000 }) {
  const match = {
    companyId: toObjectId(companyId),
    createdAt: { $gte: start, $lt: end }
  };
  const clientObjectId = toObjectId(clientId);
  if (clientObjectId) match.clientId = clientObjectId;

  return Lead.find(match)
    .select('source status clientId createdAt customData.touchpoints')
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
}

async function getRevenueByClient({ agencyId, clientId, start, end }) {
  const match = {
    agencyId: toObjectId(agencyId),
    isDeleted: { $ne: true },
    createdAt: { $gte: start, $lt: end }
  };
  const clientObjectId = toObjectId(clientId);
  if (clientObjectId) match.clientId = clientObjectId;

  const rows = await Invoice.aggregate([
    { $match: match },
    { $group: { _id: '$clientId', revenue: { $sum: '$grandTotal' } } }
  ]);

  return rows.map(r => ({ clientId: r._id ? String(r._id) : null, revenue: r.revenue || 0 }));
}

module.exports = {
  getLeadMetrics,
  getRevenueMetrics,
  getLeadsForAttribution,
  getRevenueByClient
};