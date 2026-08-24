const Department = require('./department.model');

exports.getDepartments = async (req, res, next) => {
  try {
    let queryFilter = {};
    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      queryFilter.brandId = req.user.brandId || req.user._id;
    } else {
      if (req.user.adminId && !req.user.agencyId) {
        queryFilter.adminId = req.user.adminId;
      } else {
        queryFilter.agencyId = req.companyId || req.user.agencyId || req.user._id;
      }
    }
    const departments = await Department.find(queryFilter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentsDynamic = async (req, res, next) => {
  try {
    let queryFilter = {};
    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      queryFilter.brandId = req.user.brandId || req.user._id;
    } else {
      if (req.user.adminId && !req.user.agencyId) {
        queryFilter.adminId = req.user.adminId;
      } else {
        queryFilter.agencyId = req.companyId || req.user.agencyId || req.user._id;
      }
    }
    const departments = await Department.find(queryFilter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { departments } });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.user.role === 'commander_admin') {
      data.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      data.brandId = req.user.brandId || req.user._id;
      data.agencyId = req.companyId || req.user.agencyId;
      if (req.user.adminId) data.adminId = req.user.adminId;
    } else {
      data.agencyId = req.companyId || req.user.agencyId || req.user._id;
      if (req.user.adminId) data.adminId = req.user.adminId;
    }
    const department = await Department.create(data);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
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
