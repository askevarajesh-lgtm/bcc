const HRDepartment = require('./models/department.model');

exports.getDepartments = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const departments = await HRDepartment.find({ tenantCompanyId }).populate('headOfDepartment', 'firstName lastName profilePhoto');
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.getDepartment = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const department = await HRDepartment.findOne({ _id: req.params.id, tenantCompanyId }).populate('headOfDepartment');
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const department = await HRDepartment.create({
      ...req.body,
      tenantCompanyId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const department = await HRDepartment.findOneAndUpdate(
      { _id: req.params.id, tenantCompanyId },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const department = await HRDepartment.findOneAndDelete({ _id: req.params.id, tenantCompanyId });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
