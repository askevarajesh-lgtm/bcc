const WorkspaceAudit = require('../../seoWorkspace/models/workspaceAudit.model');
const WorkspaceTechnicalAudit = require('../../seoWorkspace/models/workspaceTechnicalAudit.model');
const WorkspaceKeyword = require('../../seoWorkspace/models/workspaceKeyword.model');
const KeywordHistorySnapshot = require('../../seoWorkspace/models/keywordHistorySnapshot.model');
const WorkspaceCompetitor = require('../../seoWorkspace/models/workspaceCompetitor.model');
const WorkspaceMonitoringAlert = require('../../seoWorkspace/models/workspaceMonitoringAlert.model');
const WorkspaceAeoAudit = require('../../seoWorkspace/models/workspaceAeoAudit.model');
const WorkspaceGeoAudit = require('../../seoWorkspace/models/workspaceGeoAudit.model');

const { resolveProjects } = require('./projectScope.util');
const { round, toPercent, formatCurrencyLakhs } = require('../utils/calculations');

const RANK_BUCKETS = { top3: [1, 3], top10: [4, 10], top50: [11, 50], beyond: [51, Infinity] };

function bucketForRank(rank) {
  if (rank == null) return null;
  for (const [key, [lo, hi]] of Object.entries(RANK_BUCKETS)) {
    if (rank >= lo && rank <= hi) return key;
  }
  return null;
}

async function latestPerProject(Model, projectIds, statuses = ['completed'], extraFilter = {}) {
  if (!projectIds.length) return new Map();
  const docs = await Model.find({ projectId: { $in: projectIds }, status: { $in: statuses }, ...extraFilter })
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();

  const byProject = new Map();
  for (const doc of docs) {
    const key = String(doc.projectId);
    if (!byProject.has(key)) byProject.set(key, doc); 
  }
  return byProject;
}

async function loadWebsiteAudit(projectIds) {
  const byProject = await latestPerProject(WorkspaceAudit, projectIds);
  const audits = Array.from(byProject.values());

  const scores = audits.map(a => a.metrics?.overall).filter(v => typeof v === 'number');
  const averageScore = scores.length ? round(scores.reduce((s, v) => s + v, 0) / scores.length, 1) : null;

  const findings = audits.flatMap(a => (a.agent?.findings || []).map(f => ({
    source: 'Website Audit',
    projectId: String(a.projectId),
    category: f.category,
    severity: f.severity,
    issue: f.issue,
    affectedUrl: f.affectedUrl || null,
    taskType: f.taskType
  })));

  return { auditsRun: audits.length, averageScore, findings };
}

async function loadTechnicalSeo(projectIds) {
  const byProject = await latestPerProject(WorkspaceTechnicalAudit, projectIds);
  const audits = Array.from(byProject.values());

  const findings = audits.flatMap(a => (a.agent?.findings || []).map(f => ({
    source: 'Technical SEO',
    projectId: String(a.projectId),
    category: f.category,
    severity: f.severity,
    issue: f.issue,
    affectedUrl: f.pageUrl || null,
    taskType: f.taskType
  })));

  const crawlSignals = audits.reduce((acc, a) => {
    const c = a.signals?.crawl || {};
    acc.pagesCrawled += c.pagesCrawled || 0;
    acc.clientErrors4xx += c.clientErrors4xx || 0;
    acc.serverErrors5xx += c.serverErrors5xx || 0;
    acc.canonicalMissing += c.canonicalMissing || 0;
    return acc;
  }, { pagesCrawled: 0, clientErrors4xx: 0, serverErrors5xx: 0, canonicalMissing: 0 });

  return { auditsRun: audits.length, crawlSignals, findings };
}

function computeTechnicalIssueImpact(websiteAuditFindings, technicalSeoFindings, landingPageSessions) {
  const allFindings = [...websiteAuditFindings, ...technicalSeoFindings];
  const sessionsByPath = new Map((landingPageSessions || []).map(r => [r.dimension || r.path, r.sessions]));
  const knownPaths = Array.from(sessionsByPath.keys());

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  let sessionsAtRisk = 0;
  let urlsWithKnownImpact = 0;

  const enriched = allFindings.map(f => {
    if (bySeverity[f.severity] !== undefined) bySeverity[f.severity] += 1;
    let sessions = null;
    if (f.affectedUrl) {
      const matchedPath = knownPaths.find(p => f.affectedUrl.endsWith(p) || p.endsWith(f.affectedUrl));
      if (matchedPath) {
        sessions = sessionsByPath.get(matchedPath);
        sessionsAtRisk += sessions;
        urlsWithKnownImpact += 1;
      }
    }
    return { ...f, sessionsInRange: sessions };
  });

  const topIssues = enriched
    .filter(f => f.sessionsInRange != null)
    .sort((a, b) => b.sessionsInRange - a.sessionsInRange)
    .slice(0, 10);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const topBySeverity = enriched
    .filter(f => f.sessionsInRange == null)
    .sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))
    .slice(0, 10);

  return {
    totalIssues: allFindings.length,
    bySeverity,
    sessionsAtRisk: round(sessionsAtRisk),
    urlsWithKnownImpact,
    topIssuesBySessionImpact: topIssues,
    otherOpenIssues: topBySeverity
  };
}

async function loadTopKeywords(projectIds, limit = 15) {
  if (!projectIds.length) return { trackedCount: 0, keywords: [] };

  const trackedCount = await WorkspaceKeyword.countDocuments({ projectId: { $in: projectIds }, isDeleted: false, status: { $ne: 'Rejected' } });

  const keywords = await WorkspaceKeyword.find({
    projectId: { $in: projectIds },
    isDeleted: false,
    status: { $ne: 'Rejected' },
    $or: [{ 'metrics.trafficSource': { $ne: 'UNAVAILABLE' } }, { 'ranking.rankingSource': { $ne: 'UNAVAILABLE' } }]
  })
    .sort({ 'metrics.estimatedTraffic': -1, 'metrics.searchVolume': -1 })
    .limit(limit)
    .select('keyword metrics.searchVolume metrics.estimatedTraffic metrics.trafficSource ranking.currentRank ranking.previousRank ranking.rankChange ranking.trend ranking.url')
    .lean();

  return {
    trackedCount,
    keywords: keywords.map(k => ({
      keyword: k.keyword,
      searchVolume: k.metrics?.searchVolume || 0,
      estimatedTraffic: k.metrics?.estimatedTraffic || 0,
      currentRank: k.ranking?.currentRank ?? null,
      previousRank: k.ranking?.previousRank ?? null,
      rankChange: k.ranking?.rankChange || 0,
      trend: k.ranking?.trend || 'None',
      url: k.ranking?.url || null
    }))
  };
}

async function computeRankingImpact(projectIds, start, end) {
  if (!projectIds.length) return { improved: 0, declined: 0, newlyRanked: 0, lost: 0, avgRankChange: 0, distribution: { top3: 0, top10: 0, top50: 0, beyond: 0 }, biggestGains: [], biggestDrops: [] };

  const snapshots = await KeywordHistorySnapshot.find({
    projectId: { $in: projectIds },
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 }).select('keywordId keyword date ranking.rank').lean();

  const byKeyword = new Map();
  for (const snap of snapshots) {
    const key = String(snap.keywordId);
    if (!byKeyword.has(key)) byKeyword.set(key, { keyword: snap.keyword, first: snap, last: snap });
    else byKeyword.get(key).last = snap;
  }

  let improved = 0, declined = 0, newlyRanked = 0, lost = 0;
  let totalChange = 0, changedCount = 0;
  const deltas = [];

  for (const { keyword, first, last } of byKeyword.values()) {
    const before = first.ranking?.rank ?? null;
    const after = last.ranking?.rank ?? null;
    if (before == null && after != null) { newlyRanked += 1; continue; }
    if (before != null && after == null) { lost += 1; continue; }
    if (before == null || after == null) continue;

    const change = before - after; 
    if (change > 0) improved += 1;
    else if (change < 0) declined += 1;
    totalChange += change;
    changedCount += 1;
    deltas.push({ keyword, before, after, change });
  }

  const distribution = { top3: 0, top10: 0, top50: 0, beyond: 0 };
  for (const { last } of byKeyword.values()) {
    const bucket = bucketForRank(last.ranking?.rank ?? null);
    if (bucket) distribution[bucket] += 1;
  }

  deltas.sort((a, b) => b.change - a.change);
  const biggestGains = deltas.filter(d => d.change > 0).slice(0, 5);
  const biggestDrops = deltas.filter(d => d.change < 0).slice(-5).reverse();

  return {
    keywordsWithSnapshots: byKeyword.size,
    improved,
    declined,
    newlyRanked,
    lost,
    avgRankChange: changedCount ? round(totalChange / changedCount, 2) : 0,
    distribution,
    biggestGains,
    biggestDrops
  };
}

async function loadCompetitorContext(projectIds) {
  if (!projectIds.length) return { trackedCompetitors: 0, avgCompetitorVisibility: null, avgCompetitorDomainRank: null };

  const competitors = await WorkspaceCompetitor.find({ projectId: { $in: projectIds }, status: 'Approved' })
    .select('metrics.visibility metrics.domainRank domain')
    .lean();

  if (!competitors.length) return { trackedCompetitors: 0, avgCompetitorVisibility: null, avgCompetitorDomainRank: null };

  const visibilities = competitors.map(c => c.metrics?.visibility || 0);
  const domainRanks = competitors.map(c => c.metrics?.domainRank || 0);

  return {
    trackedCompetitors: competitors.length,
    avgCompetitorVisibility: round(visibilities.reduce((s, v) => s + v, 0) / competitors.length, 1),
    avgCompetitorDomainRank: round(domainRanks.reduce((s, v) => s + v, 0) / competitors.length, 1)
  };
}

async function loadMonitoringAlerts(projectIds, limit = 10) {
  if (!projectIds.length) return { openCount: 0, bySeverity: { Critical: 0, High: 0, Medium: 0, Low: 0 }, recent: [] };

  const openAlerts = await WorkspaceMonitoringAlert.find({ projectId: { $in: projectIds }, status: 'Open' })
    .sort({ lastDetected: -1 })
    .select('severity category source entityType lastDetected occurrences aiSummary')
    .lean();

  const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const a of openAlerts) if (bySeverity[a.severity] !== undefined) bySeverity[a.severity] += 1;

  return {
    openCount: openAlerts.length,
    bySeverity,
    recent: openAlerts.slice(0, limit)
  };
}

async function loadAeo(projectIds) {
  const byProject = await latestPerProject(WorkspaceAeoAudit, projectIds, ['completed', 'completed_with_warnings']);
  const audits = Array.from(byProject.values());
  const scores = audits.map(a => a.overallScores?.aeo).filter(v => typeof v === 'number');
  return {
    auditsRun: audits.length,
    averageScore: scores.length ? round(scores.reduce((s, v) => s + v, 0) / scores.length, 1) : null
  };
}

/** GEO — latest completed audit's overall GEO score per project, averaged. */
async function loadGeo(projectIds) {
  const byProject = await latestPerProject(WorkspaceGeoAudit, projectIds);
  const audits = Array.from(byProject.values());
  const scores = audits.map(a => a.overallGeoScore).filter(v => typeof v === 'number');
  return {
    auditsRun: audits.length,
    averageScore: scores.length ? round(scores.reduce((s, v) => s + v, 0) / scores.length, 1) : null
  };
}

function computeOrganicContribution({ channelBreakdown, attribution, totalSessions }) {
  const organicChannel = (channelBreakdown || []).find(c => c.channel === 'Organic Search');
  const defaultModelKey = attribution?.defaultModel || 'linear';
  const organicRevenueRow = attribution?.models?.[defaultModelKey]?.channels?.find(c => c.channel === 'Organic Search');

  return {
    sessions: organicChannel?.sessions || 0,
    sessionShare: totalSessions > 0 ? toPercent(((organicChannel?.sessions || 0) / totalSessions) * 100) : '0%',
    leads: organicChannel?.leads || 0,
    conversionRate: organicChannel?.conversionRate || '—',
    attributedRevenue: organicRevenueRow?.attributedRevenue || 0,
    attributedRevenueFormatted: formatCurrencyLakhs(organicRevenueRow?.attributedRevenue || 0),
    revenueShare: organicRevenueRow?.revenueShare || '0%',
    attributionModelUsed: defaultModelKey
  };
}

async function buildSeoIntelligence({ agencyId, clientId, clients, range, landingPageSessions, organicPageSessions, topReferrers, channelBreakdown, attribution, totalSessions }) {
  const projects = await resolveProjects({ agencyId, clientId, clients });
  const projectIds = projects.map(p => p._id);

  if (projectIds.length === 0) {
    return {
      connected: false,
      projectsInScope: 0,
      message: 'No SEO Workspace project is set up for this client yet.'
    };
  }

  const [
    websiteAudit,
    technicalSeo,
    topKeywords,
    rankingImpact,
    competitorContext,
    monitoringAlerts,
    aeo,
    geo
  ] = await Promise.all([
    loadWebsiteAudit(projectIds),
    loadTechnicalSeo(projectIds),
    loadTopKeywords(projectIds),
    computeRankingImpact(projectIds, range.start, range.end),
    loadCompetitorContext(projectIds),
    loadMonitoringAlerts(projectIds),
    loadAeo(projectIds),
    loadGeo(projectIds)
  ]);

  const technicalIssueImpact = computeTechnicalIssueImpact(websiteAudit.findings, technicalSeo.findings, landingPageSessions);
  const organicTrafficContribution = computeOrganicContribution({ channelBreakdown, attribution, totalSessions });

  return {
    connected: true,
    projectsInScope: projectIds.length,

    topKeywords,
    topOrganicPages: organicPageSessions || [],
    topReferrers: topReferrers || [],

    technicalIssueImpact,
    rankingImpact,
    organicTrafficContribution,

    moduleScores: {
      websiteAudit: { averageScore: websiteAudit.averageScore, auditsRun: websiteAudit.auditsRun },
      technicalSeo: { auditsRun: technicalSeo.auditsRun, crawlSignals: technicalSeo.crawlSignals },
      aeo: { averageScore: aeo.averageScore, auditsRun: aeo.auditsRun },
      geo: { averageScore: geo.averageScore, auditsRun: geo.auditsRun }
    },

    competitorContext,
    monitoringAlerts
  };
}

module.exports = { buildSeoIntelligence };