const WorkspaceProject = require('../seoWorkspace/models/workspaceProject.model');
const WorkspaceCompetitor = require('../seoWorkspace/models/workspaceCompetitor.model');
const comparisonEngine = require('./services/comparisonEngine.service');
const competitorRecommendation = require('./services/competitorRecommendation.service');
const seoTaskGenerator = require('./services/seoTaskGenerator.service');
const threatIntelligence = require('./services/threatIntelligence.service');
const opportunityEngine = require('./services/opportunityEngine.service');
const Recommendation = require('./models/recommendation.model');
const ComparisonExecutionLog = require('./models/comparisonExecutionLog.model');
const CompetitorSnapshot = require('./models/competitorSnapshot.model');

// Same tenant-scoping convention as seoWorkspace.controller.js's getWorkspaceId.
const getWorkspaceId = (req) => {
  const user = req.user;
  if (!user) return req.companyId || req.workspaceId;
  const clientRoles = ['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client'];
  if (clientRoles.includes(user.role)) {
    return user.brandId || user._id;
  }
  return user.agencyId || user._id;
};

// ─────────────────────────────────────────────────────────────────
// EXISTING ENDPOINTS (unchanged)
// ─────────────────────────────────────────────────────────────────

exports.runComparison = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { competitorDomains, type, locationCode, languageCode, forceRefresh } = req.body;
    const agencyId = getWorkspaceId(req);

    const project = await WorkspaceProject.findOne({ _id: projectId, isDeleted: false });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (!Array.isArray(competitorDomains) || competitorDomains.length === 0) {
      return res.status(422).json({ success: false, message: 'competitorDomains must be a non-empty array' });
    }
    if (!type) {
      return res.status(422).json({ success: false, message: 'type is required (keyword_gap | content_gap | backlink_gap | page_gap | top_pages | overview)' });
    }

    const result = await comparisonEngine.compare({
      projectId, agencyId, yourDomain: project.domain, competitorDomains, type,
      opts: { locationCode, languageCode, forceRefresh, projectId }
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[runComparison] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generateRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { comparisonResult } = req.body;
    const agencyId = getWorkspaceId(req);

    if (!comparisonResult || !Array.isArray(comparisonResult.rows)) {
      return res.status(422).json({ success: false, message: 'comparisonResult (with rows[]) is required — pass the output of /compare' });
    }

    const recommendations = await competitorRecommendation.generateRecommendations(comparisonResult, projectId, agencyId);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    console.error('[generateRecommendations] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    const query = { projectId };
    if (status) query.status = status;
    const recommendations = await Recommendation.find(query).sort({ priorityScore: -1 });
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.dismissRecommendations = async (req, res) => {
  try {
    const { recommendationIds } = req.body;
    const result = await Recommendation.updateMany(
      { _id: { $in: recommendationIds || [] } },
      { $set: { status: 'dismissed' } }
    );
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generateTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { recommendationIds } = req.body;
    if (!Array.isArray(recommendationIds) || recommendationIds.length === 0) {
      return res.status(422).json({ success: false, message: 'recommendationIds must be a non-empty array' });
    }

    const project = await WorkspaceProject.findById(projectId);
    const tasks = await seoTaskGenerator.generateTasks(recommendationIds, projectId, project?.domain);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error('[generateTasks] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExecutionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const history = await ComparisonExecutionLog.find({ projectId }).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// NEW ENTERPRISE ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/**
 * GET /projects/:projectId/competitors
 * List all saved competitors (Suggested + Approved) for a project.
 */
exports.getCompetitors = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    const query = { projectId, isDeleted: false };
    if (status) query.status = status;

    const competitors = await WorkspaceCompetitor.find(query)
      .sort({ threatScore: -1, 'metrics.organicTraffic': -1 })
      .lean();

    res.status(200).json({ success: true, data: competitors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /projects/:projectId/competitors/summary
 * Executive summary: totals, averages, scores across all competitors.
 * Also computes and persists threat scores for all approved competitors.
 */
exports.getCompetitorSummary = async (req, res) => {
  try {
    const { projectId } = req.params;
    const agencyId = getWorkspaceId(req);

    const project = await WorkspaceProject.findOne({ _id: projectId, isDeleted: false });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const competitors = await WorkspaceCompetitor.find({
      projectId, isDeleted: false, status: { $ne: 'Rejected' }
    }).lean();

    const approved = competitors.filter((c) => c.status === 'Approved');
    const suggested = competitors.filter((c) => c.status === 'Suggested');

    // Aggregate metrics
    const totalTraffic = competitors.reduce((s, c) => s + (c.metrics?.organicTraffic || 0), 0);
    const totalKeywords = competitors.reduce((s, c) => s + (c.metrics?.organicKeywords || 0), 0);
    const totalBacklinks = competitors.reduce((s, c) => s + (c.metrics?.backlinks || 0), 0);
    const avgThreatScore = competitors.length
      ? Math.round(competitors.reduce((s, c) => s + (c.threatScore || 0), 0) / competitors.length)
      : 0;
    const avgOpportunityScore = competitors.length
      ? Math.round(competitors.reduce((s, c) => s + (c.opportunityScore || 0), 0) / competitors.length)
      : 0;

    // Threat distribution
    const threatCounts = { low: 0, medium: 0, high: 0 };
    competitors.forEach((c) => {
      const level = c.agent?.threatLevel || 'medium';
      if (threatCounts[level] !== undefined) threatCounts[level]++;
    });

    // Recent execution stats
    const recentRuns = await ComparisonExecutionLog.find({ projectId })
      .sort({ createdAt: -1 }).limit(5).lean();

    // Recommendation count
    const openRecommendations = await Recommendation.countDocuments({ projectId, status: 'proposed' });

    const summary = {
      projectId,
      projectDomain: project.domain,
      totalCompetitors: competitors.length,
      approvedCount: approved.length,
      suggestedCount: suggested.length,
      totalTraffic,
      avgTraffic: competitors.length ? Math.round(totalTraffic / competitors.length) : 0,
      totalKeywords,
      totalBacklinks,
      avgThreatScore,
      avgOpportunityScore,
      threatDistribution: threatCounts,
      openRecommendations,
      recentRuns: recentRuns.map((r) => ({
        type: r.type,
        status: r.status,
        durationMs: r.durationMs,
        createdAt: r.createdAt
      }))
    };

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /projects/:projectId/competitors/trend
 * Trend data for all competitors (snapshots over time).
 * Query params: domain (optional), days (default 30)
 */
exports.getCompetitorTrend = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { domain, days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const query = { projectId, capturedAt: { $gte: since } };
    if (domain) query.domain = domain;

    const snapshots = await CompetitorSnapshot.find(query)
      .sort({ domain: 1, capturedAt: 1 })
      .lean();

    // Group by domain
    const byDomain = {};
    snapshots.forEach((s) => {
      if (!byDomain[s.domain]) byDomain[s.domain] = [];
      byDomain[s.domain].push({
        capturedAt: s.capturedAt,
        ...s.metrics
      });
    });

    res.status(200).json({ success: true, data: byDomain, days: Number(days) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /projects/:projectId/snapshot
 * Captures a snapshot of all approved competitors' current metrics.
 */
exports.captureSnapshot = async (req, res) => {
  try {
    const { projectId } = req.params;
    const agencyId = getWorkspaceId(req);

    const competitors = await WorkspaceCompetitor.find({
      projectId, isDeleted: false, status: 'Approved'
    }).lean();

    if (competitors.length === 0) {
      return res.status(200).json({ success: true, message: 'No approved competitors to snapshot', captured: 0 });
    }

    const snapshots = competitors.map((c) => ({
      projectId,
      competitorId: c._id,
      agencyId,
      domain: c.domain,
      metrics: {
        organicTraffic:   c.metrics?.organicTraffic   || 0,
        organicKeywords:  c.metrics?.organicKeywords  || 0,
        paidTraffic:      c.metrics?.paidTraffic      || 0,
        backlinks:        c.metrics?.backlinks        || 0,
        referringDomains: c.metrics?.referringDomains || 0,
        domainRank:       c.metrics?.domainRank       || 0,
        authority:        c.metrics?.authority        || 0,
        estimatedRevenue: c.metrics?.estimatedRevenue || 0,
        indexedPages:     c.metrics?.indexedPages     || 0,
        visibility:       c.metrics?.visibility       || 0,
        threatScore:      c.threatScore               || 0,
        opportunityScore: c.opportunityScore          || 0,
        aiVisibility:     c.aiScore                   || 0
      },
      dataSource: c.dataSource,
      capturedAt: new Date()
    }));

    await CompetitorSnapshot.insertMany(snapshots);

    res.status(201).json({ success: true, captured: snapshots.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /projects/:projectId/opportunities
 * Returns opportunity buckets derived from Recommendations.
 */
exports.getOpportunities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    const result = await opportunityEngine.getOpportunities(projectId, { status });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /projects/:projectId/threat-scores
 * Re-compute and persist threat scores for all competitors in a project.
 */
exports.computeThreatScores = async (req, res) => {
  try {
    const { projectId } = req.params;
    const agencyId = getWorkspaceId(req);
    const { yourMetrics = {} } = req.body;

    const scores = await threatIntelligence.computeAndSave(projectId, yourMetrics, {
      useAi: true,
      workspaceId: agencyId
    });

    res.status(200).json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

