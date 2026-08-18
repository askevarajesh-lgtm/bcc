/**
 * Attribution Engine — orchestrator.
 *
 * For every real lead in scope, builds its touchpoint sequence (see
 * touchpoints.util.js), applies each of the five weighting models (see
 * attributionModels.js), and aggregates the resulting per-channel credit
 * into lead counts and revenue.
 *
 * Revenue attribution methodology (explicit, not hidden): invoices aren't
 * linked to individual leads anywhere in this app's data model, so exact
 * deal-level revenue-to-channel mapping doesn't exist. Instead, each
 * client's real invoice revenue for the period is distributed across
 * channels in proportion to that same client's attribution-weighted lead
 * mix for the period. A client with revenue but no leads in the period
 * (e.g. a retainer invoice unrelated to new leads that month) can't be
 * honestly mapped to a channel at all — that revenue is reported separately
 * as `unattributedRevenue` rather than guessed at.
 */
const crm = require('../sources/crm.source');
const { buildTouchpoints } = require('./touchpoints.util');
const { MODEL_FNS, MODEL_META, MODEL_KEYS } = require('./attributionModels');
const { round, toPercent, formatCurrencyLakhs } = require('../utils/calculations');

function distributeRevenue(perClientChannelWeight, perClientTotalWeight, revenueByClient) {
  const channelRevenue = new Map();
  let unattributedRevenue = 0;

  for (const [clientKey, revenue] of revenueByClient.entries()) {
    if (!revenue) continue;
    const totalWeight = perClientTotalWeight.get(clientKey) || 0;
    const channelWeights = perClientChannelWeight.get(clientKey);

    if (!channelWeights || totalWeight <= 0) {
      // This client had invoiced revenue in the period but no attributable
      // leads in the same period — there's no honest way to tie it to a
      // channel, so it's surfaced explicitly rather than force-attributed.
      unattributedRevenue += revenue;
      continue;
    }

    for (const [channel, weight] of channelWeights.entries()) {
      const share = weight / totalWeight;
      channelRevenue.set(channel, (channelRevenue.get(channel) || 0) + revenue * share);
    }
  }

  return { channelRevenue, unattributedRevenue };
}

function runModel(modelKey, leads, revenueByClient) {
  const modelFn = MODEL_FNS[modelKey];
  const channelLeadCredit = new Map();
  const perClientChannelWeight = new Map();
  const perClientTotalWeight = new Map();
  let multiTouchLeadCount = 0;

  for (const lead of leads) {
    const touchpoints = buildTouchpoints(lead);
    if (touchpoints.length > 1) multiTouchLeadCount += 1;

    const weighted = modelFn(touchpoints);
    const clientKey = lead.clientId ? String(lead.clientId) : 'unassigned';

    if (!perClientChannelWeight.has(clientKey)) perClientChannelWeight.set(clientKey, new Map());
    const clientChannelWeights = perClientChannelWeight.get(clientKey);

    for (const { channel, weight } of weighted) {
      if (weight <= 0) continue;
      channelLeadCredit.set(channel, (channelLeadCredit.get(channel) || 0) + weight);
      clientChannelWeights.set(channel, (clientChannelWeights.get(channel) || 0) + weight);
      perClientTotalWeight.set(clientKey, (perClientTotalWeight.get(clientKey) || 0) + weight);
    }
  }

  const { channelRevenue, unattributedRevenue } = distributeRevenue(perClientChannelWeight, perClientTotalWeight, revenueByClient);

  const totalLeadCredit = Array.from(channelLeadCredit.values()).reduce((s, v) => s + v, 0);
  const totalRevenue = Array.from(channelRevenue.values()).reduce((s, v) => s + v, 0);

  const allChannels = new Set([...channelLeadCredit.keys(), ...channelRevenue.keys()]);
  const channels = Array.from(allChannels).map(channel => {
    const attributedLeads = round(channelLeadCredit.get(channel) || 0, 2);
    const attributedRevenue = round(channelRevenue.get(channel) || 0);
    return {
      channel,
      attributedLeads,
      leadShare: totalLeadCredit > 0 ? toPercent((attributedLeads / totalLeadCredit) * 100) : '0%',
      attributedRevenue,
      attributedRevenueFormatted: formatCurrencyLakhs(attributedRevenue),
      revenueShare: totalRevenue > 0 ? toPercent((attributedRevenue / totalRevenue) * 100) : '0%'
    };
  }).sort((a, b) => b.attributedRevenue - a.attributedRevenue || b.attributedLeads - a.attributedLeads);

  return {
    channels,
    totals: {
      leads: round(totalLeadCredit, 2),
      revenue: round(totalRevenue),
      revenueFormatted: formatCurrencyLakhs(totalRevenue),
      unattributedRevenue: round(unattributedRevenue),
      unattributedRevenueFormatted: formatCurrencyLakhs(unattributedRevenue)
    },
    multiTouchLeadCount
  };
}

/**
 * Computes attribution across all five models for an agency (optionally
 * scoped to one client) over [start, end).
 */
async function computeAttribution({ agencyId, clientId, start, end, preferredModel }) {
  const [leads, revenueRows] = await Promise.all([
    crm.getLeadsForAttribution({ companyId: agencyId, clientId, start, end }),
    crm.getRevenueByClient({ agencyId, clientId, start, end })
  ]);

  const revenueByClient = new Map(revenueRows.map(r => [r.clientId || 'unassigned', r.revenue]));

  const models = {};
  let multiTouchLeadCount = 0;
  for (const modelKey of MODEL_KEYS) {
    const result = runModel(modelKey, leads, revenueByClient);
    multiTouchLeadCount = Math.max(multiTouchLeadCount, result.multiTouchLeadCount);
    models[modelKey] = { channels: result.channels, totals: result.totals };
  }

  const touchpointGranularity = multiTouchLeadCount > 0 ? 'multi-touch' : 'single-touch';
  const defaultModel = MODEL_KEYS.includes(preferredModel) ? preferredModel : 'linear';

  return {
    defaultModel,
    availableModels: MODEL_META,
    models,
    touchpointGranularity,
    leadCount: leads.length,
    methodology: touchpointGranularity === 'multi-touch'
      ? 'Each lead\'s recorded touchpoint history is weighted per model below. Revenue is distributed to channels in proportion to each client\'s attribution-weighted lead mix for the period; invoiced revenue for clients with no leads in the period is reported as unattributed rather than guessed.'
      : 'The CRM currently records a single source per lead (no session-level touchpoint history yet), so every model below is applied to a one-touchpoint sequence and produces the same channel split until multi-touch capture exists. Revenue is distributed to channels in proportion to each client\'s lead-channel mix for the period; invoiced revenue for clients with no leads in the period is reported as unattributed rather than guessed.'
  };
}

module.exports = { computeAttribution };
