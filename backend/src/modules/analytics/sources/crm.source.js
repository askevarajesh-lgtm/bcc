/**
 * CRM data source for the Analytics & Attribution engine.
 * Every number here comes from an actual MongoDB aggregation over the real
 * `Lead` and `Invoice` collections already used by the rest of the app —
 * no stand-in schemas, no synthetic records.
 */
const mongoose = require('mongoose');
const Lead = require('../../leads/lead.model');
const Invoice = require('../../invoices/invoice.model');
const { normalizeChannel } = require('../utils/channelBucket');

const toObjectId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

/**
 * Total lead count + leads grouped by normalized channel, for a
 * companyId (agency) optionally scoped to one clientId, within [start, end).
 */
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

/**
 * Total revenue (sum of invoice grand totals raised) for an agency,
 * optionally scoped to one client, within [start, end). Uses `createdAt`
 * (when the invoice was raised) as the revenue-recognition date, consistent
 * with how invoices are reported elsewhere in the app.
 */
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

module.exports = {
  getLeadMetrics,
  getRevenueMetrics
};
