const Department = require('./department.model');

exports.getDepartments = async (req, res, next) => {
  try {
    let queryFilter = {};
    if (['brand_super_admin', 'brand_manager'].includes(req.user.role) && req.user.brandId) {
      queryFilter.brandId = req.user.brandId;
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role) && req.user.agencyId) {
      queryFilter.agencyId = req.user.agencyId;
    }
    const departments = await Department.find(queryFilter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      data.brandId = req.user.brandId;
      data.agencyId = req.user.agencyId;
    }
    const department = await Department.create(data);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
