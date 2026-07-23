const semrushService = require('./semrush.service');

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
