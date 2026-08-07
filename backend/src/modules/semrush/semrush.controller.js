
const mongoose = require('mongoose');
const semrushService = require('./semrush.service');
const trackingService = require('./semrush.tracking');
const SemrushProject = require('./models/semrushProject.model');
const SemrushProjectData = require('./models/semrushProjectData.model');

const OptimizationScore = require('../seoIntelligence/models/optimizationScore.model');

exports.getProjects = async (req, res) => {
  try {
    const projects = await SemrushProject.find({ companyId: req.companyId, isActive: true }).lean().sort({ createdAt: -1 });
    
    // Fetch latest optimization scores for these projects
    const projectIds = projects.map(p => p._id);
    const scores = await OptimizationScore.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).lean();
    
    const enrichedProjects = projects.map(project => {
      const latestScore = scores.find(s => s.projectId.toString() === project._id.toString());
      return {
        ...project,
        optimizationScore: latestScore ? {
          seoScore: latestScore.seoScore,
          geoScore: latestScore.geoScore,
          aeoScore: latestScore.aeoScore
        } : null
      };
    });

    res.status(200).json({ success: true, data: enrichedProjects });
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
      name,
      clientId: req.body.clientId || null
    });

    await project.save();
    
    // We don't block on initial data fetch to keep UI responsive. We can trigger a background refresh or just return empty.
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('[Semrush Controller - createProject]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



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

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    const updates = req.body;
    
    // Prevent updating critical non-editable fields if any
    delete updates._id;
    delete updates.companyId;

    const project = await SemrushProject.findOneAndUpdate(
      { _id: id, companyId: req.companyId, isActive: true },
      updates,
      { new: true, runValidators: true }
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('[Semrush Controller - updateProject]', error);
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

    // Fetch project from DB first to get the domain
    let project = await SemrushProject.findOne({ _id: id, companyId: req.companyId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let semrushProjectId = project.semrushProjectId;
    let semrushCampaignId = project.semrushCampaignId;

    // Connect to Semrush Management API
    try {
      if (!semrushProjectId) {
        const srProjects = await semrushService.getProjects();
        const existing = srProjects.find(p => p.url === project.domain || p.project_name === project.domain);
        if (existing) {
          semrushProjectId = existing.project_id;
        } else {
          const newProj = await semrushService.createProject(project.domain);
          if (newProj && newProj.project_id) {
            semrushProjectId = newProj.project_id;
          }
        }
      }

      if (semrushProjectId && !semrushCampaignId) {
        const campaigns = await semrushService.getTrackingCampaigns(semrushProjectId);
        if (campaigns && campaigns.length > 0) {
          semrushCampaignId = campaigns[0].id; // Just pick the first tracking campaign
        } else {
          // Default to US (2840) or India (2356) based on location param if possible
          const locId = location === 'in' ? 2356 : 2840;
          await semrushService.enableTrackingCampaign(semrushProjectId, project.domain, locId);
          // Wait a moment and fetch campaigns again to get the generated ID
          await new Promise(r => setTimeout(r, 2000));
          const newCampaigns = await semrushService.getTrackingCampaigns(semrushProjectId);
          if (newCampaigns && newCampaigns.length > 0) {
            semrushCampaignId = newCampaigns[0].id;
          }
        }
      }
    } catch (apiErr) {
      console.error('[Semrush Controller - Sync API Error]', apiErr.message);
      // We log but continue, ensuring the local DB is updated at least
    }

    project = await SemrushProject.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { 
        $set: {
          semrushProjectId: semrushProjectId,
          semrushCampaignId: semrushCampaignId,
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

    // Sync keywords to Semrush campaign in the background (do not block response)
    if (semrushCampaignId && limitedKeywords.length > 0) {
      semrushService.syncKeywordsToCampaign(semrushCampaignId, limitedKeywords)
        .catch(err => console.error('[configureTracking] Keyword sync failed:', err.message));
    }
    
    res.status(200).json({ success: true, message: 'Tracking configured. Keywords synced to Semrush — rankings will appear within 24 hours.', data: project });
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
    const campaignId = project.semrushCampaignId;
    const force = req.query.force === 'true';
    
    const trackingData = await trackingService.getPositionTrackingData(domain, database, keywords, campaignId, force);
    
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
    const { domain, database, force } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getDomainOverview(domain, database, force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getDomainOverview]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKeywordResearch = async (req, res) => {
  try {
    const { keyword, database, force } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }
    
    const data = await semrushService.getKeywordResearch(keyword, database, force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getKeywordResearch]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBacklinksOverview = async (req, res) => {
  try {
    const { domain, force } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getBacklinksOverview(domain, force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getBacklinksOverview]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSiteHealth = async (req, res) => {
  try {
    const { domain, database, force } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getSiteHealth(domain, database || 'us', force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getSiteHealth]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDomainKeywordsDrilldown = async (req, res) => {
  try {
    const { domain, limit, force } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getDomainKeywordsDrilldown(domain, 'us', limit ? parseInt(limit) : 100, force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getDomainKeywordsDrilldown]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompetitorAnalysis = async (req, res) => {
  try {
    const { domain, database, limit, force } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getCompetitorAnalysis(domain, database || 'us', limit ? parseInt(limit) : 20, force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getCompetitorAnalysis]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTrafficAnalytics = async (req, res) => {
  try {
    const { domain, force } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    
    const data = await semrushService.getTrafficAnalytics(domain, force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getTrafficAnalytics]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKeywordMagicTool = async (req, res) => {
  try {
    const { keyword, database, matchType, force } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }
    
    const data = await semrushService.getKeywordMagicTool(keyword, database || 'us', matchType || 'phrase', force === 'true');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Semrush Controller - getKeywordMagicTool]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
