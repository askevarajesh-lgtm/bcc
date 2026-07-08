const ContentOrchestrationService = require('./services/ContentOrchestrationService');

exports.generate = async (req, res) => {
  try {
    const payload = req.body;
    payload.workspaceId = req.companyId || req.workspaceId;

    if (!payload.workspaceId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });
    }
    
    // In a real app we would validate the payload here using express-validator
    
    const contentItem = await ContentOrchestrationService.generate(payload, req.user || { _id: payload.workspaceId });

    return res.status(201).json({ success: true, data: contentItem });
  } catch (error) {
    console.error('Content generation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.regenerate = async (req, res) => {
  // same as generate but uses previous item context
  return this.generate(req, res);
};

exports.integrationStatus = async (req, res) => {
  try {
    const gscConnected = !!process.env.GSC_CREDENTIALS;
    const ga4Connected = !!(process.env.GA4_CREDENTIALS && process.env.GA4_PROPERTY_ID);
    
    return res.status(200).json({
      success: true,
      data: {
        gscConnected,
        ga4Connected
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
