exports.validateCreateFunnel = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, error: 'Funnel name is required' });
  }
  next();
};

exports.validateAddStep = (req, res, next) => {
  const { stepName } = req.body;
  if (!stepName || typeof stepName !== 'string' || stepName.trim() === '') {
    return res.status(400).json({ success: false, error: 'Step name is required' });
  }
  next();
};
