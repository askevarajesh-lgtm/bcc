const WorkspaceProject = require('./models/workspaceProject.model');
const WorkspaceAudit = require('./models/workspaceAudit.model');
const WorkspaceKeyword = require('./models/workspaceKeyword.model');
const WorkspaceStrategy = require('./models/workspaceStrategy.model');
const WorkspaceTask = require('./models/workspaceTask.model');
const WorkspaceReport = require('./models/workspaceReport.model');

const WorkspaceAgentOrchestrator = require('./services/workspaceAgentOrchestrator.service');
const WordPressService = require('../seoIntelligence/services/wordPress.service');
const GoogleService = require('../seoIntelligence/services/google.service');
const dataForSeoService = require('../seoIntelligence/dataForSeo.service');

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
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    project.settings = settings;
    await project.save();
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const audits = await WorkspaceAudit.find(query).populate('projectId', 'name').sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeywords = async (req, res) => {
  try {
    const query = req.query.projectId ? { projectId: req.query.projectId } : {};
    const keywords = await WorkspaceKeyword.find(query).populate('projectId', 'name').sort({ 'metrics.searchVolume': -1 });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStrategies = async (req, res) => {
  try {
    const query = req.query.projectId ? { projectId: req.query.projectId } : {};
    const strategies = await WorkspaceStrategy.find(query).populate('projectId', 'name').sort({ createdAt: -1 });
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateStrategy = async (req, res) => {
  try {
    const { projectId } = req.params;
    const orchestrator = new WorkspaceAgentOrchestrator();
    const result = await orchestrator.runOrchestration(projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.publishStrategy = async (req, res) => {
  try {
    const { projectId, strategyId } = req.params;
    
    const project = await WorkspaceProject.findById(projectId);
    const strategy = await WorkspaceStrategy.findById(strategyId);
    
    if (!project || !strategy) throw new Error('Project or Strategy not found');

    const wpService = new WordPressService(
      project.credentials?.wpRestApiUrl,
      project.credentials?.wpUsername,
      project.credentials?.wpAppPassword
    );

    const result = await wpService.publishDraft(strategy.title, strategy.content);
    
    strategy.status = 'Published';
    await strategy.save();

    res.json({ message: 'Published successfully to WordPress', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await WorkspaceProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
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
      gsc: gscData,
      ga4: ga4Data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await WorkspaceTask.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    let task = await WorkspaceTask.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    task.status = status;
    
    if (status === 'Approved') {
      const project = await WorkspaceProject.findById(task.projectId);
      if (project) {
        const wpService = new WordPressService(
          project.credentials?.wpRestApiUrl || process.env.WP_SITE_URL,
          project.credentials?.wpUsername || process.env.WP_USER,
          project.credentials?.wpAppPassword || process.env.WP_APP_PASSWORD
        );
        
        try {
          await wpService.publishTaskUpdate(task.taskType, task.pageUrl, task.proposedChanges);
          task.status = 'Implemented';
        } catch (wpError) {
          console.error('WordPress publish failed for task:', wpError);
          task.status = 'Failed';
        }
      }
    }
    
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await WorkspaceReport.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    
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
    const report = await orchestrator.generateFinalReport(projectId, auditDiff);

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
