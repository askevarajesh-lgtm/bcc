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
const dataForSeoService = require('../seoIntelligence/dataForSeo.service');
const auditLogService = require('./services/auditLog.service');

exports.getProjects = async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;
    const query = { companyId, isDeleted: false };
    const isClientRole = ['agency_client', 'client', 'brand_manager', 'brand_super_admin', 'brand_team_user'].includes(req.user.role);
    if (isClientRole) {
      query.clientId = req.user.brandId || req.user._id;
    } else if (req.query.clientId) {
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

    const domain = project.domain.replace(/^https?:\/\/(www\.)?/, '');
    
    const auditResponse = await dataForSeoService.runOnPageAudit(domain, 1);
    const result = auditResponse?.result;
    
    if (result) {
      const score = Math.round(result.page_metrics?.onpage_score || 0);
      
      const metrics = result.page_metrics || {};
      const checks = metrics.checks || {};
      
      const newAudit = await WorkspaceAudit.create({
        projectId: project._id,
        agencyId: companyId,
        taskId: auditResponse.id || 'manual',
        status: 'completed',
        metrics: {
          onpageScore: score,
          technicalScore: score,
          pagesCrawled: 1,
          performance: score,
          crawlability: score,
          security: score,
          onPage: score,
          overall: score
        },
        issues: {
          brokenLinks: metrics.broken_links || 0,
          missingMeta: (checks.no_title || 0) + (checks.no_description || 0),
          slowPages: checks.high_loading_time || 0
        },
        completedAt: new Date()
      });

      await WorkspaceProject.findByIdAndUpdate(projectId, {
        $set: { 'stats.lastAuditScore': score, lastAuditSync: new Date(), phase: 'audit' }
      });

      res.status(200).json({ success: true, data: newAudit, score });
    } else {
      res.status(400).json({ success: false, message: 'Failed to retrieve audit data' });
    }
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error running audit' });
  }
};

exports.getAudits = async (req, res) => {
  try {
    const query = req.query.projectId ? { projectId: req.query.projectId } : {};
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [audits, total] = await Promise.all([
      WorkspaceAudit.find(query).populate('projectId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WorkspaceAudit.countDocuments(query)
    ]);

    res.json({ success: true, data: audits, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getKeywords = async (req, res) => {
  try {
    const query = req.query.projectId ? { projectId: req.query.projectId } : {};
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [keywords, total] = await Promise.all([
      WorkspaceKeyword.find(query).populate('projectId', 'name').sort({ 'metrics.searchVolume': -1 }).skip((page - 1) * limit).limit(limit),
      WorkspaceKeyword.countDocuments(query)
    ]);

    res.json({ success: true, data: keywords, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStrategies = async (req, res) => {
  try {
    const query = req.query.projectId ? { projectId: req.query.projectId } : {};
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [strategies, total] = await Promise.all([
      WorkspaceStrategy.find(query).populate('projectId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WorkspaceStrategy.countDocuments(query)
    ]);

    res.json({ success: true, data: strategies, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generateStrategy = async (req, res) => {
  try {
    const { projectId } = req.params;
    const orchestrator = new WorkspaceAgentOrchestrator();
    const result = await orchestrator.runOrchestration(projectId);
    res.json({ success: true, data: result });
  } catch (error) {
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
    const project = await WorkspaceProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
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
    const query = { projectId: req.params.projectId };
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [tasks, total] = await Promise.all([
      WorkspaceTask.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WorkspaceTask.countDocuments(query)
    ]);

    res.json({ success: true, data: tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [reports, total] = await Promise.all([
      WorkspaceReport.find({ projectId: req.params.projectId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WorkspaceReport.countDocuments({ projectId: req.params.projectId })
    ]);

    res.json({ success: true, data: reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { isScheduled, scheduleFrequency, emailRecipients } = req.body || {};

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
    });

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