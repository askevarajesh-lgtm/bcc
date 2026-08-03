
const semrushService = require('./semrush.service');
const trackingService = require('./semrush.tracking');
const SemrushProject = require('./models/semrushProject.model');
const SemrushProjectData = require('./models/semrushProjectData.model');

exports.getProjects = async (req, res) => {
  try {
    const projects = await SemrushProject.find({ companyId: req.companyId, isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('[Semrush Controller - getProjects]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { domain, name } = req.body;
    if (!domain || !name) {
      return res.status(400).json({ success: false, message: 'Domain and name are required' });
    }

    const existing = await SemrushProject.findOne({ companyId: req.companyId, domain });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Project for this domain already exists' });
    }

    const project = new SemrushProject({
      companyId: req.companyId,
      createdBy: req.user._id,
      domain,
      name
    });

    await project.save();
    
    // We don't block on initial data fetch to keep UI responsive. We can trigger a background refresh or just return empty.
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('[Semrush Controller - createProject]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const mongoose = require('mongoose');

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    const project = await SemrushProject.findOne({ _id: id, companyId: req.companyId, isActive: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get latest data snapshot
    const latestData = await SemrushProjectData.findOne({ projectId: id }).sort({ snapshotDate: -1 });
    
    res.status(200).json({ success: true, project, data: latestData ? latestData.data : null });
  } catch (error) {
    console.error('[Semrush Controller - getProjectById]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    const project = await SemrushProject.findOne({ _id: id, companyId: req.companyId, isActive: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Fetch new data from Semrush
    const domain = project.domain;
    const database = req.query.database || 'us'; // Default to US if not provided
    
    // Fetch in parallel for speed
    const [overview, backlinks, siteHealth, keywords] = await Promise.all([
      semrushService.getDomainOverview(domain, database).catch(e => null),
      semrushService.getBacklinksOverview(domain).catch(e => null),
      semrushService.getSiteHealth(domain, database).catch(e => null),
      semrushService.getDomainKeywordsDrilldown(domain, database, 100).catch(e => null)
    ]);

    const snapshotData = {
      overview: Array.isArray(overview) ? (overview.length > 0 ? overview[0] : null) : overview,
      backlinksOverview: Array.isArray(backlinks) ? (backlinks.length > 0 ? backlinks[0] : null) : backlinks,
      siteHealth,
      organicKeywords: keywords
    };

    // Save snapshot
    const projectData = new SemrushProjectData({
      projectId: project._id,
      data: snapshotData
    });
    await projectData.save();

    const overviewData = snapshotData.overview || {};
    const backlinksData = snapshotData.backlinksOverview || {};

    // Update stats on project
    let aiVisibility = 0; // Mock calculation or from another source
    let mentions = 0; // Mock
    let visibility = overviewData.visibility_index || 0;
    let organicTraffic = overviewData['Organic Traffic'] || overviewData.Ot || 0;
    let organicKeywords = overviewData['Organic Keywords'] || overviewData.Or || 0;
    let totalBacklinks = backlinksData.total || 0;
    let siteHealthScore = siteHealth?.overallScore || 0;

    project.stats = {
      ...project.stats,
      aiVisibility,
      mentions,
      siteHealth: siteHealthScore,
      visibility,
      organicTraffic,
      organicKeywords,
      backlinks: totalBacklinks
    };
    project.lastRefresh = Date.now();
    await project.save();

    res.status(200).json({ success: true, project, data: snapshotData });
  } catch (error) {
    console.error('[Semrush Controller - refreshProject]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    const project = await SemrushProject.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { isActive: false },
      { returnDocument: 'after' }
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('[Semrush Controller - deleteProject]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.configureTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { device, location, keywords } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    
    // limit keywords to 100 max
    const limitedKeywords = (keywords || []).slice(0, 100);

    const project = await SemrushProject.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { 
        $set: {
          trackingConfig: {
            isActive: true,
            searchEngine: 'Google',
            device: device || 'Desktop',
            location: location || 'us',
            businessName: '',
            keywords: limitedKeywords,
            lastUpdated: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.status(200).json({ success: true, message: 'Tracking configured', data: project });
  } catch (error) {
    console.error('[Semrush Controller - configureTracking]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPositionTracking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    const project = await SemrushProject.findOne({ _id: id, companyId: req.companyId, isActive: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (!project.trackingConfig || !project.trackingConfig.isActive) {
      return res.status(200).json({ success: true, data: { isConfigured: false } });
    }
    
    const domain = project.domain;
    const database = project.trackingConfig.location || 'us';
    const keywords = project.trackingConfig.keywords || [];
    
    const trackingData = await trackingService.getPositionTrackingData(domain, database, keywords);
    
    res.status(200).json({ 
      success: true, 
      data: {
        isConfigured: true,
        config: project.trackingConfig,
        rankings: trackingData
      }
    });
  } catch (error) {
    console.error('[Semrush Controller - getPositionTracking]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy Endpoints
exports.getDomainOverview = async (req, res) => {
  try {
    const { domain, database } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getDomainOverview(domain, database);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getDomainOverview]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKeywordResearch = async (req, res) => {
  try {
    const { keyword, database } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }
    
    const data = await semrushService.getKeywordResearch(keyword, database);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getKeywordResearch]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBacklinksOverview = async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getBacklinksOverview(domain);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getBacklinksOverview]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSiteHealth = async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getSiteHealth(domain);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getSiteHealth]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDomainKeywordsDrilldown = async (req, res) => {
  try {
    const { domain, limit } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getDomainKeywordsDrilldown(domain, 'us', limit ? parseInt(limit) : 100);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getDomainKeywordsDrilldown]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
