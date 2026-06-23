const Integration = require('./integration.model');

exports.getIntegrations = async (req, res, next) => {
  try {
    const integrations = await Integration.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: integrations.length, data: integrations });
  } catch (error) {
    next(error);
  }
};

exports.getIntegration = async (req, res, next) => {
  try {
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }
    res.status(200).json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
};

exports.createIntegration = async (req, res, next) => {
  try {
    const integration = await Integration.create(req.body);
    res.status(201).json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
};

exports.updateIntegration = async (req, res, next) => {
  try {
    const integration = await Integration.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }
    res.status(200).json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
};

exports.deleteIntegration = async (req, res, next) => {
  try {
    const integration = await Integration.findByIdAndDelete(req.params.id);
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
