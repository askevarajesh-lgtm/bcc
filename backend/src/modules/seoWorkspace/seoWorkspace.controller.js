const WorkspaceProject = require('./models/workspaceProject.model');
const WorkspaceAudit = require('./models/workspaceAudit.model');
const WorkspaceKeyword = require('./models/workspaceKeyword.model');
const WorkspaceStrategy = require('./models/workspaceStrategy.model');
const WorkspaceTask = require('./models/workspaceTask.model');
const WorkspaceReport = require('./models/workspaceReport.model');
const WorkspaceComment = require('./models/workspaceComment.model');
const WorkspaceAttachment = require('./models/workspaceAttachment.model');
const WorkspaceAuditLog = require('./models/workspaceAuditLog.model');

const WorkspaceAgentOrchestrator = require('./services/workspaceAgentOrchestrator.service');
const WordPressService = require('../seoIntelligence/services/wordPress.service');
const GoogleService = require('../seoIntelligence/services/google.service');
const seoAuditorAgent = require('./services/seoAuditorAgent.service');
const keywordResearchAgent = require('./services/keywordResearchAgent.service');
const competitorAgent = require('./services/competitorAgent.service');
const technicalSeoAgent = require('./services/technicalSeoAgent.service');
const contentAgent = require('./services/contentAgent.service');
const auditLogService = require('./services/auditLog.service');
const AiSettings = require('../aiStudio/models/aiSettings.model');
const cryptoUtils = require('../../utils/crypto');

const getWorkspaceId = (req) => {
  const user = req.user;
  if (!user) return req.companyId || req.workspaceId;
  const clientRoles = ['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client'];
  if (clientRoles.includes(user.role)) {
    return user.brandId || user._id;
  }
  return user.agencyId || user._id;
};

exports.getSettingsStatus = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    if (!workspaceId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const settings = await AiSettings.findOne({ workspaceId });
    let isAnthropicConfigured = false;
    let maskedAnthropicKey = '';

    if (settings && settings.anthropicApiKey) {
      isAnthropicConfigured = true;
      const decrypted = cryptoUtils.decrypt(settings.anthropicApiKey);
      if (decrypted && decrypted.length > 8) {
        maskedAnthropicKey = decrypted.substring(0, 7) + '...' + decrypted.substring(decrypted.length - 4);
      } else {
        maskedAnthropicKey = 'sk-ant-...';
      }
    }

    return res.status(200).json({
      success: true,
      data: { isAnthropicConfigured, maskedAnthropicKey }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const { anthropicApiKey } = req.body;
    const workspaceId = getWorkspaceId(req);

    if (!workspaceId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const updateFields = {};
    if (anthropicApiKey !== undefined) {
      if (anthropicApiKey.trim() !== '') {
        updateFields.anthropicApiKey = cryptoUtils.encrypt(anthropicApiKey.trim());
      } else {
        updateFields.anthropicApiKey = null;
      }
    }

    await AiSettings.findOneAndUpdate(
      { workspaceId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    // Strictly isolate data: Users only see projects they explicitly created
    const query = { companyId, isDeleted: false, createdBy: req.user._id };

    if (req.query.clientId) {
      query.clientId = req.query.clientId;
    }

    const projects = await WorkspaceProject.find(query)
      .populate('clientId', 'name companyName brandName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error('Error fetching Workspace projects:', error);
    res.status(500).json({ success: false, message: 'Server error fetching Workspace projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const { domain, siteUrl, name, clientId, projectId, targetLocations, searchEngines, languages } = req.body;
    
    const projectDomain = domain || siteUrl;
    if (!projectDomain || !name) {
      return res.status(400).json({ success: false, message: 'Domain/siteUrl and name are required.' });
    }

    const resolvedClientId = clientId || req.user._id;

    const existing = await WorkspaceProject.findOne({ domain: projectDomain, companyId, isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Workspace Project for this domain already exists.' });
    }

    const project = await WorkspaceProject.create({
      companyId,
      clientId: resolvedClientId,
      projectId: projectId || null,
      domain: projectDomain,
      name,
      targetLocations: targetLocations || [{ location_code: 2840, location_name: 'United States', country_iso_code: 'US' }],
      searchEngines: searchEngines || ['google'],
      languages: languages || ['en'],
      createdBy: req.user._id,
      phase: 'intake'
    });

    auditLogService.record({
      targetType: 'Project', targetId: project._id, projectId: project._id,
      action: 'created', fromValue: null, toValue: { domain: projectDomain, name }, userId: req.user._id
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Error creating Workspace project:', error);
    res.status(500).json({ success: false, message: 'Server error creating Workspace project' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { settings } = req.body;
    
    const project = await WorkspaceProject.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const fromSettings = project.settings;
    project.settings = settings;
    await project.save();

    auditLogService.record({
      targetType: 'Project', targetId: project._id, projectId: project._id,
      action: 'settings_updated', fromValue: fromSettings, toValue: settings, userId: req.user._id
    });

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.runAudit = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const project = await WorkspaceProject.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delegates to the SEO Auditor Agent's raw-collection step (same
    // DataForSEO call + field mapping this endpoint used to do inline,
    // moved to seoAuditorAgent.service.js so it isn't duplicated between
    // this manual/no-AI trigger and the full agent run below). maxCrawlPages
    // stays at 1, matching this endpoint's exact prior behavior; the full
    // agent run (runAuditorAgent) requests a deeper 5-page crawl instead.
    // Response shape is unchanged: { success, data, score }.
    const newAudit = await seoAuditorAgent.collectRawAudit(project, companyId, 1);

    res.status(200).json({ success: true, data: newAudit, score: newAudit.metrics.overall || newAudit.metrics.onpageScore });
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error running audit' });
  }
};

// --- SEO Auditor Agent (own prompt/service/execution history/logs/retry/
// approval/shared memory — see seoAuditorAgent.service.js). No UI consumes
// these yet; exposed here so the agent can be triggered/reviewed
// programmatically (manual call, cron, another agent, etc). ---

exports.runAuditorAgent = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const project = await WorkspaceProject.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const workspaceId = getWorkspaceId(req);
    const audit = await seoAuditorAgent.run(projectId, workspaceId);

    res.status(200).json({ success: true, data: audit });
  } catch (error) {
    console.error('[runAuditorAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveAuditFindings = async (req, res) => {
  try {
    const { projectId, auditId } = req.params;
    const { audit, createdTasks } = await seoAuditorAgent.approveFindings(auditId, projectId, req.user._id);
    res.status(200).json({ success: true, data: audit, createdTasks });
  } catch (error) {
    console.error('Error approving audit findings:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving audit findings' });
  }
};

exports.rejectAuditFindings = async (req, res) => {
  try {
    const { projectId, auditId } = req.params;
    const { reason } = req.body;
    const audit = await seoAuditorAgent.rejectFindings(auditId, projectId, req.user._id, reason);
    res.status(200).json({ success: true, data: audit });
  } catch (error) {
    console.error('Error rejecting audit findings:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error rejecting audit findings' });
  }
};

exports.getAuditorExecutionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const history = await seoAuditorAgent.getExecutionHistory(projectId, limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Keyword Research Agent (own prompt/service/execution history/logs/
// retry/approval/shared memory — see keywordResearchAgent.service.js).
// No UI consumes these yet; exposed for manual/cron/agent-to-agent
// triggering, same rationale as the SEO Auditor Agent's routes above. ---

exports.runKeywordResearchAgent = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const { seedKeyword } = req.body || {};

    const project = await WorkspaceProject.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const workspaceId = getWorkspaceId(req);
    const result = await keywordResearchAgent.run(projectId, workspaceId, { seedKeyword });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[runKeywordResearchAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveKeywordSuggestions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { keywordIds } = req.body;
    const result = await keywordResearchAgent.approveKeywords(projectId, keywordIds, req.user._id);
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error approving keyword suggestions:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving keyword suggestions' });
  }
};

exports.rejectKeywordSuggestions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { keywordIds, reason } = req.body;
    const result = await keywordResearchAgent.rejectKeywords(projectId, keywordIds, req.user._id, reason);
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error rejecting keyword suggestions:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error rejecting keyword suggestions' });
  }
};

exports.getKeywordResearchExecutionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const history = await keywordResearchAgent.getExecutionHistory(projectId, limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.runCompetitorAgent = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const project = await WorkspaceProject.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const workspaceId = getWorkspaceId(req);
    const result = await competitorAgent.run(projectId, workspaceId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[runCompetitorAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveCompetitorSuggestions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { competitorIds } = req.body;
    const result = await competitorAgent.approveCompetitors(projectId, competitorIds, req.user._id);
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error approving competitor suggestions:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving competitor suggestions' });
  }
};

exports.rejectCompetitorSuggestions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { competitorIds, reason } = req.body;
    const result = await competitorAgent.rejectCompetitors(projectId, competitorIds, req.user._id, reason);
    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error rejecting competitor suggestions:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error rejecting competitor suggestions' });
  }
};

exports.getCompetitorExecutionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const history = await competitorAgent.getExecutionHistory(projectId, limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Technical SEO Agent (own prompt/service/execution history/logs/retry/
// approval/shared memory — see technicalSeoAgent.service.js). No UI consumes
// these; exposed for manual/cron/agent-to-agent triggering, same rationale
// as the SEO Auditor, Keyword Research, and Competitor agents' routes. ---

exports.runTechnicalSeoAgent = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const project = await WorkspaceProject.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const workspaceId = getWorkspaceId(req);
    const result = await technicalSeoAgent.run(projectId, workspaceId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[runTechnicalSeoAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveTechnicalFindings = async (req, res) => {
  try {
    const { projectId, auditId } = req.params;
    const { audit, createdTasks } = await technicalSeoAgent.approveFindings(auditId, projectId, req.user._id);
    res.status(200).json({ success: true, data: audit, createdTasks });
  } catch (error) {
    console.error('Error approving technical findings:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving technical findings' });
  }
};

exports.rejectTechnicalFindings = async (req, res) => {
  try {
    const { projectId, auditId } = req.params;
    const { reason } = req.body;
    const result = await technicalSeoAgent.rejectFindings(auditId, projectId, req.user._id, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error rejecting technical findings:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error rejecting technical findings' });
  }
};

exports.getTechnicalSeoExecutionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const history = await technicalSeoAgent.getExecutionHistory(projectId, limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Content Agent (own prompt/service/execution history/logs/retry/
// approval/shared memory — see contentAgent.service.js). No UI consumes
// these; exposed for manual/cron/agent-to-agent triggering, same rationale
// as the SEO Auditor, Keyword Research, Competitor, and Technical SEO
// agents' routes above. ---

exports.runContentAgent = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const project = await WorkspaceProject.findOne({ _id: projectId, companyId, isDeleted: false });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const workspaceId = getWorkspaceId(req);
    const result = await contentAgent.run(projectId, workspaceId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[runContentAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveContentBriefs = async (req, res) => {
  try {
    const { projectId, contentBriefId } = req.params;
    const { contentBrief, createdTasks } = await contentAgent.approveBriefs(contentBriefId, projectId, req.user._id);
    res.status(200).json({ success: true, data: contentBrief, createdTasks });
  } catch (error) {
    console.error('Error approving content briefs:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving content briefs' });
  }
};

exports.rejectContentBriefs = async (req, res) => {
  try {
    const { projectId, contentBriefId } = req.params;
    const { reason } = req.body;
    const result = await contentAgent.rejectBriefs(contentBriefId, projectId, req.user._id, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error rejecting content briefs:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error rejecting content briefs' });
  }
};

exports.getContentAgentExecutionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const history = await contentAgent.getExecutionHistory(projectId, limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAudits = async (req, res) => {
  try {
    const projects = await WorkspaceProject.find({ createdBy: req.user._id }, '_id');
    const projectIds = projects.map(p => p._id);
    
    const query = { projectId: { $in: projectIds } };
    if (req.query.projectId) {
      if (!projectIds.some(id => id.toString() === req.query.projectId)) {
        return res.json([]);
      }
      query.projectId = req.query.projectId;
    }
    
    const audits = await WorkspaceAudit.find(query).populate('projectId', 'name').sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getKeywords = async (req, res) => {
  try {
    const projects = await WorkspaceProject.find({ createdBy: req.user._id }, '_id');
    const projectIds = projects.map(p => p._id);
    
    const query = { projectId: { $in: projectIds } };
    if (req.query.projectId) {
      if (!projectIds.some(id => id.toString() === req.query.projectId)) {
        return res.json([]);
      }
      query.projectId = req.query.projectId;
    }

    const keywords = await WorkspaceKeyword.find(query).populate('projectId', 'name').sort({ 'metrics.searchVolume': -1 });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStrategies = async (req, res) => {
  try {
    const projects = await WorkspaceProject.find({ createdBy: req.user._id }, '_id');
    const projectIds = projects.map(p => p._id);
    
    const query = { projectId: { $in: projectIds } };
    if (req.query.projectId) {
      if (!projectIds.some(id => id.toString() === req.query.projectId)) {
        return res.json([]);
      }
      query.projectId = req.query.projectId;
    }

    const strategies = await WorkspaceStrategy.find(query).populate('projectId', 'name').sort({ createdAt: -1 });
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generateStrategy = async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = req.user;
    
    let workspaceId;
    if (!user) {
      workspaceId = req.companyId || req.workspaceId;
    } else {
      const clientRoles = ['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client'];
      if (clientRoles.includes(user.role)) {
        workspaceId = user.brandId || user._id;
      } else {
        workspaceId = user.agencyId || user._id;
      }
    }

    const orchestrator = new WorkspaceAgentOrchestrator();
    const result = await orchestrator.runOrchestration(projectId, workspaceId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[generateStrategy] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveStrategy = async (req, res) => {
  try {
    const { projectId, strategyId } = req.params;

    const strategy = await WorkspaceStrategy.findOne({ _id: strategyId, projectId });
    if (!strategy) {
      return res.status(404).json({ success: false, message: 'Strategy not found' });
    }

    if (!['Draft', 'Pending Approval'].includes(strategy.status)) {
      return res.status(400).json({ success: false, message: `Strategy cannot be approved from status '${strategy.status}'.` });
    }

    strategy.status = 'Approved';
    strategy.rejectionReason = null;
    await strategy.save();

    // WorkspaceProject.approvals was already modeled for exactly this and never written to — reuse it.
    await WorkspaceProject.findByIdAndUpdate(projectId, {
      $set: {
        'approvals.strategyApproved': true,
        'approvals.strategyApprovedBy': req.user._id,
        'approvals.strategyApprovedAt': new Date()
      }
    });

    auditLogService.record({
      targetType: 'Strategy', targetId: strategy._id, projectId,
      action: 'status_change', fromValue: 'Pending Approval', toValue: 'Approved', userId: req.user._id
    });

    res.status(200).json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error approving strategy:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error approving strategy' });
  }
};

exports.rejectStrategy = async (req, res) => {
  try {
    const { projectId, strategyId } = req.params;
    const { reason } = req.body;

    const strategy = await WorkspaceStrategy.findOne({ _id: strategyId, projectId });
    if (!strategy) {
      return res.status(404).json({ success: false, message: 'Strategy not found' });
    }

    if (!['Draft', 'Pending Approval'].includes(strategy.status)) {
      return res.status(400).json({ success: false, message: `Strategy cannot be rejected from status '${strategy.status}'.` });
    }

    strategy.status = 'Rejected';
    strategy.rejectionReason = reason || null;
    await strategy.save();

    await WorkspaceProject.findByIdAndUpdate(projectId, {
      $set: { 'approvals.strategyApproved': false }
    });

    auditLogService.record({
      targetType: 'Strategy', targetId: strategy._id, projectId,
      action: 'status_change', fromValue: 'Pending Approval', toValue: 'Rejected', userId: req.user._id
    });

    res.status(200).json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error rejecting strategy:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error rejecting strategy' });
  }
};

exports.publishStrategy = async (req, res) => {
  try {
    const { projectId, strategyId } = req.params;
    
    const project = await WorkspaceProject.findById(projectId);
    const strategy = await WorkspaceStrategy.findById(strategyId);
    
    if (!project || !strategy) throw new Error('Project or Strategy not found');

    if (strategy.status !== 'Approved') {
      return res.status(400).json({ success: false, message: `Publish Gate Blocked: Strategy must be 'Approved' before publishing. Current status is '${strategy.status}'.` });
    }

    const wpService = new WordPressService(
      project.credentials?.wpRestApiUrl,
      project.credentials?.wpUsername,
      project.credentials?.wpAppPassword
    );

    const result = await wpService.publishDraft(strategy.title, strategy.content);
    
    strategy.status = 'Published';
    await strategy.save();

    auditLogService.record({
      targetType: 'Strategy', targetId: strategy._id, projectId,
      action: 'status_change', fromValue: 'Approved', toValue: 'Published', userId: req.user._id
    });

    res.json({ success: true, message: 'Published successfully to WordPress', data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await WorkspaceProject.findOne({ _id: projectId, createdBy: req.user._id });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const gscPath = process.env.GSC_CREDENTIALS;
    const ga4Path = process.env.GA4_CREDENTIALS;
    const ga4PropertyId = process.env.GA4_PROPERTY_ID;
    
    const googleService = new GoogleService(gscPath || ga4Path);
    
    const [gscData, ga4Data] = await Promise.all([
      googleService.getSearchConsoleData(project.siteUrl || project.domain, startDate, endDate),
      ga4PropertyId ? googleService.getAnalyticsData(ga4PropertyId, startDate, endDate) : Promise.resolve({ sessions: 0, users: 0, conversions: 0, rows: [] })
    ]);

    res.json({
      success: true,
      data: { gsc: gscData, ga4: ga4Data }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const project = await WorkspaceProject.findOne({ _id: req.params.projectId, createdBy: req.user._id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    const tasks = await WorkspaceTask.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    let task = await WorkspaceTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const fromStatus = task.status;
    task.status = status;
    task.failureReason = null;
    
    if (status === 'Approved') {
      const project = await WorkspaceProject.findById(task.projectId);
      if (project) {
        const wpService = new WordPressService(
          project.credentials?.wpRestApiUrl || process.env.WP_SITE_URL,
          project.credentials?.wpUsername || process.env.WP_USER,
          project.credentials?.wpAppPassword || process.env.WP_APP_PASSWORD
        );
        
        try {
          await wpService.publishTaskUpdate(task.projectId, task.strategyId, task._id, task.taskType, task.pageUrl, task.proposedChanges);
          task.status = 'Implemented';
        } catch (wpError) {
          console.error('WordPress publish failed for task:', wpError);
          task.status = 'Failed';
          task.failureReason = wpError.message;
        }
      }
    }
    
    await task.save();

    auditLogService.record({
      targetType: 'Task', targetId: task._id, projectId: task.projectId,
      action: 'status_change', fromValue: fromStatus, toValue: task.status, userId: req.user._id
    });

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const project = await WorkspaceProject.findOne({ _id: req.params.projectId, createdBy: req.user._id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    const reports = await WorkspaceReport.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { isScheduled, scheduleFrequency, emailRecipients } = req.body || {};
    const workspaceId = getWorkspaceId(req);

    if (isScheduled && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
      return res.status(400).json({ success: false, error: "scheduleFrequency must be one of 'daily', 'weekly', 'monthly' when isScheduled is true." });
    }

    const audits = await WorkspaceAudit.find({ projectId }).sort({ createdAt: -1 }).limit(2);
    if (audits.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 audits to generate a comparative report.' });
    }

    const latest = audits[0].metrics;
    const previous = audits[1].metrics;

    const auditDiff = {
      diff: {
        performance: latest.performance - previous.performance,
        onPage: latest.onPage - previous.onPage,
        crawlability: latest.crawlability - previous.crawlability,
        overall: latest.overall - previous.overall
      }
    };

    const orchestrator = new WorkspaceAgentOrchestrator();
    const report = await orchestrator.seoReporterAgent(projectId, auditDiff, {
      isScheduled: !!isScheduled,
      scheduleFrequency: isScheduled ? scheduleFrequency : null,
      emailRecipients: Array.isArray(emailRecipients) ? emailRecipients : []
    }, workspaceId);

    if (isScheduled) {
      auditLogService.record({
        targetType: 'Report', targetId: report._id, projectId,
        action: 'schedule_created', fromValue: null, toValue: scheduleFrequency, userId: req.user._id
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Comments (polymorphic across Strategy/Task/Report) ---

const VALID_TARGET_TYPES = ['Strategy', 'Task', 'Report'];

exports.getComments = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ success: false, message: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    const comments = await WorkspaceComment.find({ targetType, targetId, isDeleted: false })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ success: false, message: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    const { projectId, body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Comment body is required.' });
    }
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required.' });
    }

    const comment = await WorkspaceComment.create({
      targetType, targetId, projectId, body: body.trim(), userId: req.user._id
    });
    const populated = await comment.populate('userId', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await WorkspaceComment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Only the author can remove their own comment.
    if (String(comment.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
    }

    comment.isDeleted = true;
    await comment.save();

    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Attachments (polymorphic across Strategy/Task/Report) ---

exports.getAttachments = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ success: false, message: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    const attachments = await WorkspaceAttachment.find({ targetType, targetId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: attachments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createAttachment = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ success: false, message: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    const { projectId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required.' });
    }

    const attachment = await WorkspaceAttachment.create({
      targetType,
      targetId,
      projectId,
      fileUrl: req.file.path, // CloudinaryStorage sets `.path` to the hosted URL
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await WorkspaceAttachment.findById(attachmentId);
    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

    if (String(attachment.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own attachments.' });
    }

    await attachment.deleteOne();
    res.json({ success: true, data: { _id: attachmentId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- History (read-only view over WorkspaceAuditLog) ---

exports.getHistory = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    if (targetType && !VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ success: false, message: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const query = targetType && targetId ? { targetType, targetId } : { projectId: req.params.projectId };

    const [entries, total] = await Promise.all([
      WorkspaceAuditLog.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WorkspaceAuditLog.countDocuments(query)
    ]);

    res.json({ success: true, data: entries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Dashboard (aggregate rollup for the workspace overview) ---

exports.getDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const projectQuery = { companyId, isDeleted: false };
    const isClientRole = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'].includes(req.user.role);
    if (isClientRole) {
      projectQuery.clientId = req.user.brandId || req.user._id;
    }

    const projects = await WorkspaceProject.find(projectQuery).select('_id name domain phase stats').lean();
    const projectIds = projects.map(p => p._id);

    const [
      pendingStrategies,
      pendingTasks,
      failedTasks,
      recentActivity
    ] = await Promise.all([
      WorkspaceStrategy.countDocuments({ projectId: { $in: projectIds }, status: 'Pending Approval' }),
      WorkspaceTask.countDocuments({ projectId: { $in: projectIds }, status: 'Pending' }),
      WorkspaceTask.countDocuments({ projectId: { $in: projectIds }, status: 'Failed' }),
      WorkspaceAuditLog.find({ projectId: { $in: projectIds } }).populate('userId', 'name').sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        projects,
        pendingStrategies,
        pendingTasks,
        failedTasks,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Global search across Projects/Strategies/Tasks/Reports for this tenant ---

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Query param `q` is required.' });
    }

    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const projectQuery = { companyId, isDeleted: false };
    const isClientRole = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'].includes(req.user.role);
    if (isClientRole) {
      projectQuery.clientId = req.user.brandId || req.user._id;
    }

    const scopedProjects = await WorkspaceProject.find(projectQuery).select('_id').lean();
    const projectIds = scopedProjects.map(p => p._id);
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [projects, strategies, tasks] = await Promise.all([
      WorkspaceProject.find({ _id: { $in: projectIds }, $or: [{ name: regex }, { domain: regex }] }).select('_id name domain').limit(10),
      WorkspaceStrategy.find({ projectId: { $in: projectIds }, title: regex }).select('_id title projectId status').limit(10),
      WorkspaceTask.find({ projectId: { $in: projectIds }, $or: [{ pageUrl: regex }, { taskType: regex }] }).select('_id taskType pageUrl projectId status').limit(10)
    ]);

    res.json({ success: true, data: { projects, strategies, tasks } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};