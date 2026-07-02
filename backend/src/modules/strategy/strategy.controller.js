const StrategyService = require('./strategy.service');

exports.getStrategy = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }

    const strategy = await StrategyService.getStrategy(agencyId);
    res.status(200).json({ success: true, data: strategy });
  } catch (error) {
    console.error('Error in getStrategy:', error);
    next(error);
  }
};

exports.generateStrategy = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }

    const newStrategy = await StrategyService.generateStrategy(agencyId);
    res.status(200).json({ success: true, message: 'Strategy generated successfully', data: newStrategy });
  } catch (error) {
    next(error);
  }
};

exports.addObjective = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }

    const { title, client, owner, progress, status, quarter, keyResults } = req.body;
    
    if (!title || !client) {
      return res.status(400).json({ success: false, message: 'Title and Client are required' });
    }

    const objectiveData = {
      title,
      client,
      owner: owner || 'Agency Manager',
      progress: progress || 0,
      status: status || 'ON TRACK',
      quarter: quarter || 'Q3 FY26',
      keyResults: keyResults || []
    };

    const updatedStrategy = await StrategyService.addObjective(agencyId, objectiveData);
    res.status(200).json({ success: true, message: 'Objective added successfully', data: updatedStrategy });
  } catch (error) {
    next(error);
  }
};

exports.addInitiative = async (req, res, next) => {
  try {
    const agencyId = req.companyId || (req.user && (req.user.agencyId || req.user.workspaceId || req.user.agency));
    if (!agencyId) {
      return res.status(400).json({ success: false, message: 'Agency ID missing from user token' });
    }

    const { initiative, client, channel, owner, phase, timeline, deps, status } = req.body;
    
    if (!initiative || !client) {
      return res.status(400).json({ success: false, message: 'Initiative and Client are required' });
    }

    const initiativeData = {
      initiative,
      client,
      channel: channel || 'SEO',
      owner: owner || 'Agency Manager',
      phase: phase || 'Plan',
      timeline: timeline || 'TBD',
      deps: deps || 0,
      status: status || 'PLANNING'
    };

    const updatedStrategy = await StrategyService.addInitiative(agencyId, initiativeData);
    res.status(200).json({ success: true, message: 'Initiative added successfully', data: updatedStrategy });
  } catch (error) {
    next(error);
  }
};
