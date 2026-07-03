const mongoose = require('mongoose');
const Employee = require('./models/employee.model');
const Department = require('./models/department.model');
const Designation = require('./models/designation.model');

exports.getEmployees = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    
    // Pagination & Search
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { tenantCompanyId };

    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { employeeCode: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.departmentId) query.departmentId = req.query.departmentId;

    const employees = await Employee.find(query)
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .populate('reportingManagerId', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      count: employees.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const employee = await Employee.findOne({ _id: req.params.id, tenantCompanyId })
      .populate('departmentId')
      .populate('designationId')
      .populate('reportingManagerId', 'firstName lastName email profilePhoto');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    
    // Check code uniqueness
    const existingCode = await Employee.findOne({ tenantCompanyId, employeeCode: req.body.employeeCode });
    if (existingCode) return res.status(400).json({ success: false, message: 'Employee code already exists' });

    // Resolve Department string to ID
    let finalDeptId = req.body.departmentId;
    if (finalDeptId && !mongoose.Types.ObjectId.isValid(finalDeptId)) {
      let dept = await Department.findOne({ tenantCompanyId, name: new RegExp(`^${finalDeptId}$`, 'i') });
      if (!dept) {
        dept = await Department.create({ tenantCompanyId, name: finalDeptId, createdBy: req.user._id });
      }
      finalDeptId = dept._id;
    }

    // Resolve Designation string to ID
    let finalDesigId = req.body.designationId;
    if (finalDesigId && !mongoose.Types.ObjectId.isValid(finalDesigId)) {
      let desig = await Designation.findOne({ tenantCompanyId, title: new RegExp(`^${finalDesigId}$`, 'i') });
      if (!desig) {
        desig = await Designation.create({ tenantCompanyId, title: finalDesigId, departmentId: finalDeptId || null, createdBy: req.user._id });
      }
      finalDesigId = desig._id;
    }

    const employee = await Employee.create({
      ...req.body,
      departmentId: finalDeptId || undefined,
      designationId: finalDesigId || undefined,
      tenantCompanyId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const employee = await Employee.findOneAndDelete({ _id: req.params.id, tenantCompanyId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
