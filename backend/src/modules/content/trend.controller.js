const ContentTrendRepository = require('./repositories/ContentTrendRepository');

exports.getTrends = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const { channel = 'general' } = req.query;
    
    const trends = await ContentTrendRepository.findByChannel(workspaceId, channel);
    return res.status(200).json({ success: true, data: { trends } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshTrends = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const { channels } = req.body;
    // In a real app this would call ContentResearchService
    // For now we will return mock data
    
    return res.status(200).json({ success: true, message: 'Trends refreshed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveIdea = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const trend = await ContentTrendRepository.update(req.params.id, workspaceId, { isSavedIdea: true });
    return res.status(200).json({ success: true, data: trend });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
