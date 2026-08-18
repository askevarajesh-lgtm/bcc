/**
 * Customer Journey — built dynamically from real data, every run.
 *
 * Nodes and edges are never a fixed/hardcoded list: channel nodes are the
 * distinct normalized channels actually present in the queried leads, and
 * stage nodes are the distinct real `Lead.status` values actually present
 * (the same enum the CRM's lead form uses: NEW, CONTACTED, FOLLOW_UP,
 * IN_PROGRESS, CONVERTED, LOST, JUNK) — a status that has zero leads in the
 * period simply doesn't produce a node. The final Revenue node only appears
 * when there are CONVERTED leads AND real invoice revenue in the period,
 * and its value is the actual invoiced revenue for that scope/period.
 *
 * What this does NOT claim: because invoices aren't linked to individual
 * leads (see attribution.service.js), this journey shows the real
 * channel → status flow and the real total revenue for converted leads in
 * the period, but it does not claim to know exactly which channel's leads
 * produced which invoice dollar — that per-channel revenue split is what
 * the Attribution Engine's revenue distribution computes separately.
 */
const mongoose = require('mongoose');
const Lead = require('../../leads/lead.model');
const Invoice = require('../../invoices/invoice.model');
const { normalizeChannel } = require('../utils/channelBucket');
const { round, formatCurrencyLakhs } = require('../utils/calculations');

const toObjectId = (id) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

function formatStatusLabel(status) {
  return status
    .split('_')
    .map(w => (w ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function emptyJourney() {
  return {
    nodes: [],
    links: [],
    meta: {
      totalLeads: 0,
      convertedLeads: 0,
      totalRevenue: 0,
      totalRevenueFormatted: formatCurrencyLakhs(0),
      generatedAt: new Date().toISOString()
    }
  };
}

async function buildCustomerJourney({ agencyId, clientId, start, end }) {
  const agencyObjectId = toObjectId(agencyId);
  if (!agencyObjectId) return emptyJourney();

  const leadMatch = { companyId: agencyObjectId, createdAt: { $gte: start, $lt: end } };
  const clientObjectId = toObjectId(clientId);
  if (clientObjectId) leadMatch.clientId = clientObjectId;

  const leads = await Lead.find(leadMatch).select('source status clientId').lean();
  if (leads.length === 0) return emptyJourney();

  const channelCounts = new Map();
  const statusCounts = new Map();
  const channelStatusEdges = new Map(); // "channel||status" -> count

  for (const lead of leads) {
    const channel = normalizeChannel(lead.source);
    const status = String(lead.status || 'new').toUpperCase();

    channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

    const edgeKey = `${channel}||${status}`;
    channelStatusEdges.set(edgeKey, (channelStatusEdges.get(edgeKey) || 0) + 1);
  }

  const convertedCount = statusCounts.get('CONVERTED') || 0;

  let totalRevenue = 0;
  if (convertedCount > 0) {
    const revenueMatch = { agencyId: agencyObjectId, isDeleted: { $ne: true }, createdAt: { $gte: start, $lt: end } };
    if (clientObjectId) revenueMatch.clientId = clientObjectId;
    const [revenueResult] = await Invoice.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' } } }
    ]);
    totalRevenue = revenueResult?.revenue || 0;
  }

  const nodes = [];
  const links = [];

  for (const [channel, value] of channelCounts.entries()) {
    nodes.push({ id: `channel:${channel}`, label: channel, type: 'channel', value });
  }
  for (const [status, value] of statusCounts.entries()) {
    nodes.push({ id: `status:${status}`, label: formatStatusLabel(status), type: 'status', value });
  }
  for (const [edgeKey, value] of channelStatusEdges.entries()) {
    const [channel, status] = edgeKey.split('||');
    links.push({ source: `channel:${channel}`, target: `status:${status}`, value });
  }

  if (convertedCount > 0 && totalRevenue > 0) {
    nodes.push({ id: 'revenue:total', label: 'Revenue (Converted)', type: 'revenue', value: round(totalRevenue) });
    links.push({ source: 'status:CONVERTED', target: 'revenue:total', value: convertedCount });
  }

  return {
    nodes,
    links,
    meta: {
      totalLeads: leads.length,
      convertedLeads: convertedCount,
      totalRevenue: round(totalRevenue),
      totalRevenueFormatted: formatCurrencyLakhs(totalRevenue),
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = { buildCustomerJourney };
