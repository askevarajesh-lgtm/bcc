const geoAeoService = require('./services/geoAeo.service');
const OptimizationScore = require('./models/optimizationScore.model');
const SeoWebsite = require('./models/seoProject.model');
const SemrushProject = require('../semrush/models/semrushProject.model');

exports.refreshScores = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    const scoreRecord = await geoAeoService.calculateScores(projectId, companyId, req.user._id);
    
    res.status(200).json({ success: true, data: scoreRecord });
  } catch (error) {
    console.error('Error refreshing GEO/AEO scores:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error refreshing scores' });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId || req.user.agencyId || req.user._id;

    let website = await SemrushProject.findOne({ _id: projectId, companyId, isActive: true });
    if (!website) {
      website = await SeoWebsite.findOne({ _id: projectId, companyId, isDeleted: false });
    }
    
    if (!website) return res.status(404).json({ success: false, message: 'SEO Project not found' });

    // Fetch the two most recent records to calculate difference
    const history = await OptimizationScore.find({ projectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(30);

    let current = null;
    let previous = null;
    let trend = [];

    if (history.length > 0) {
      current = history[0];
      if (history.length > 1) previous = history[1];
      
      // Prepare trend data (oldest to newest for charts)
      trend = history.reverse().map(record => ({
        date: record.createdAt.toISOString().split('T')[0],
        seoScore: record.seoScore,
        geoScore: record.geoScore,
        aeoScore: record.aeoScore,
        overallScore: record.overallScore
      }));
    } else {
      // If no history, calculate now
      current = await geoAeoService.calculateScores(projectId, companyId, req.user._id);
      trend = [{
        date: current.createdAt.toISOString().split('T')[0],
        seoScore: current.seoScore,
        geoScore: current.geoScore,
        aeoScore: current.aeoScore,
        overallScore: current.overallScore
      }];
    }

    res.status(200).json({
      success: true,
      data: {
        current,
        previous,
        trend
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
  }
};
