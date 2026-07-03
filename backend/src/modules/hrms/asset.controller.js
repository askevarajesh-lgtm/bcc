const Asset = require('./models/asset.model');

exports.getAssets = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const assets = await Asset.find({ tenantCompanyId })
      .populate('assignedTo', 'firstName lastName profilePhoto employeeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    next(error);
  }
};

exports.createAsset = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const asset = await Asset.create({
      ...req.body,
      tenantCompanyId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

exports.assignAsset = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { employeeId } = req.body;

    const asset = await Asset.findOne({ _id: req.params.id, tenantCompanyId });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    if (asset.status === 'Assigned') {
      return res.status(400).json({ success: false, message: 'Asset is already assigned' });
    }

    asset.assignedTo = employeeId;
    asset.status = 'Assigned';
    asset.assignmentDate = new Date();
    asset.returnDate = null;
    
    // Log history
    asset.history.push({
      employeeId,
      assignedAt: new Date()
    });

    await asset.save();
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

exports.returnAsset = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    
    const asset = await Asset.findOne({ _id: req.params.id, tenantCompanyId });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    if (asset.status !== 'Assigned') {
      return res.status(400).json({ success: false, message: 'Asset is not currently assigned' });
    }

    const currentEmployeeId = asset.assignedTo;
    asset.assignedTo = null;
    asset.status = 'Available';
    asset.returnDate = new Date();

    // Update history
    const lastHistory = asset.history[asset.history.length - 1];
    if (lastHistory && lastHistory.employeeId.toString() === currentEmployeeId.toString() && !lastHistory.returnedAt) {
       lastHistory.returnedAt = new Date();
       lastHistory.notes = req.body.notes || 'Returned normally';
    }

    await asset.save();
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};
