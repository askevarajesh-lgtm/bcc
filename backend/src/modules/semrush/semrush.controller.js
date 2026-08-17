
const mongoose = require('mongoose');
const semrushService = require('./semrush.service');
const trackingService = require('./semrush.tracking');
const SemrushProject = require('./models/semrushProject.model');
const SemrushProjectData = require('./models/semrushProjectData.model');

const OptimizationSnapshot = require('./models/optimizationSnapshot.model');

exports.getProjects = async (req, res) => {
  try {
    const projects = await SemrushProject.find({ companyId: req.companyId, isActive: true })
      .populate('latestSnapshot')
      .lean()
      .sort({ createdAt: -1 });
    
    const enrichedProjects = projects.map(project => {
      const snap = project.latestSnapshot || {};
      return {
        ...project,
        optimizationScore: snap.scores ? {
          seoScore: snap.scores.seo,
          geoScore: snap.scores.geo,
          aeoScore: snap.scores.aeo
        } : null,
        stats: {
          siteHealth: snap.seo?.technicalScore?.value || null,
          visibility: snap.seo?.authorityScore?.value || null,
          organicTraffic: snap.seo?.organicTraffic?.value || null,
          organicKeywords: snap.seo?.organicKeywords?.value || null,
          backlinks: snap.seo?.backlinks?.value || null
        }
      };
    });

    res.status(200).json({ success: true, data: enrichedProjects });
  } catch (error) {
    console.error('[Semrush Controller - getProjects]', error);
    res.status(500).json({ success: false, message: error.stack });
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



const IntelligenceRefreshJob = require('./models/intelligenceRefreshJob.model');

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid project ID format' });
    }
    const project = await SemrushProject.findOne({ _id: id, companyId: req.companyId, isActive: true })
      .populate('latestSnapshot');
      
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const snap = project.latestSnapshot || {};
    
    // Check if there is an active job running for this project
    const activeJob = await IntelligenceRefreshJob.findOne({
      companyId: req.companyId,
      projectId: id,
      status: { $in: ['QUEUED', 'RUNNING'] }
    });

    // Map snapshot to old data shape so frontend tabs don't crash
    const mappedData = snap.seo ? {
      overview: {
        'Organic Traffic': snap.seo.organicTraffic?.value,
        'Organic Keywords': snap.seo.organicKeywords?.value,
        Rank: snap.seo.authorityScore?.value,
        visibility_index: snap.seo.authorityScore?.value
      },
      backlinksOverview: {
        total: snap.seo.backlinks?.value,
        score: snap.seo.authorityScore?.value
      },
      siteHealth: {
        overallScore: snap.seo.technicalScore?.value
      },
      organicKeywords: [],
      // Pass the raw snapshot alongside the mapped data for refactored tabs
      snapshot: snap,
      activeJob: activeJob ? {
        status: activeJob.status,
        startedAt: activeJob.startedAt,
        id: activeJob._id
      } : null
    } : {
      overview: {},
      backlinksOverview: {},
      siteHealth: {},
      organicKeywords: [],
      snapshot: snap,
      activeJob: activeJob ? {
        status: activeJob.status,
        startedAt: activeJob.startedAt,
        id: activeJob._id
      } : null
    };
    
    res.status(200).json({ success: true, project, data: mappedData });
  } catch (error) {
    console.error('[Semrush Controller - getProjectById]', error);
    res.status(500).json({ success: false, message: error.stack });
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

    // Try to create a new job. Rely on partial unique index to prevent duplicates
    let job;
    try {
      job = await IntelligenceRefreshJob.create({
        companyId: req.companyId,
        projectId: project._id,
        status: 'QUEUED'
      });
    } catch (err) {
      if (err.code === 11000) {
        // A job is already active
        job = await IntelligenceRefreshJob.findOne({
          companyId: req.companyId,
          projectId: project._id,
          status: { $in: ['QUEUED', 'RUNNING'] }
        });
      } else {
        throw err;
      }
    }

    res.status(202).json({ success: true, message: 'Refresh queued', job });
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

// Legacy live endpoints deleted - Intelligence architecture handles this in the background workers now
