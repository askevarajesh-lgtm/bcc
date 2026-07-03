const HRDesignation = require('./models/designation.model');

exports.getDesignations = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const designations = await HRDesignation.find({ tenantCompanyId }).populate('departmentId', 'name');
    res.status(200).json({ success: true, count: designations.length, data: designations });
  } catch (error) {
    next(error);
  }
};

exports.createDesignation = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const designation = await HRDesignation.create({
      ...req.body,
      tenantCompanyId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: designation });
  } catch (error) {
    next(error);
  }
};

exports.updateDesignation = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const designation = await HRDesignation.findOneAndUpdate(
      { _id: req.params.id, tenantCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    next(error);
  }
};

exports.deleteDesignation = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const designation = await HRDesignation.findOneAndDelete({ _id: req.params.id, tenantCompanyId });
    if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
