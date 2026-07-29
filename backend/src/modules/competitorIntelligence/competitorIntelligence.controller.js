const WorkspaceProject = require('../seoWorkspace/models/workspaceProject.model');
const comparisonEngine = require('./services/comparisonEngine.service');
const competitorRecommendation = require('./services/competitorRecommendation.service');
const seoTaskGenerator = require('./services/seoTaskGenerator.service');
const Recommendation = require('./models/recommendation.model');
const ComparisonExecutionLog = require('./models/comparisonExecutionLog.model');

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
      return res.status(422).json({ success: false, message: 'type is required (keyword_gap | content_gap | backlink_gap | page_gap | overview)' });
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
