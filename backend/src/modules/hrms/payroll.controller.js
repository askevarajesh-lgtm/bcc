const Payroll = require('./models/payroll.model');

exports.getPayrolls = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const query = { tenantCompanyId };
    
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.month) query.month = req.query.month;

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName profilePhoto employeeCode bankDetails designationId departmentId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: payrolls.length, data: payrolls });
  } catch (error) {
    next(error);
  }
};

exports.generatePayroll = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { employeeId, month, basicPay, hra, allowances, bonus, pf, esi, professionalTax, incomeTax, otherDeductions } = req.body;

    // Calculate net salary
    const grossEarnings = (basicPay || 0) + (hra || 0) + (allowances || 0) + (bonus || 0);
    const grossDeductions = (pf || 0) + (esi || 0) + (professionalTax || 0) + (incomeTax || 0) + (otherDeductions || 0);
    const netSalary = grossEarnings - grossDeductions;

    let payroll = await Payroll.findOne({ tenantCompanyId, employeeId, month });

    if (payroll) {
      if (payroll.status === 'Paid') {
        return res.status(400).json({ success: false, message: 'Payroll for this month is already paid' });
      }
      payroll = await Payroll.findOneAndUpdate(
        { _id: payroll._id },
        { ...req.body, netSalary, processedBy: req.user._id },
        { new: true }
      );
    } else {
      payroll = await Payroll.create({
        ...req.body,
        tenantCompanyId,
        netSalary,
        status: "Draft",
        processedBy: req.user._id
      });
    }

    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

exports.updatePayrollStatus = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { status } = req.body;

    const payroll = await Payroll.findOne({ _id: req.params.id, tenantCompanyId });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });

    payroll.status = status;
    if (status === 'Paid') {
      payroll.paymentDate = new Date();
    }
    
    await payroll.save();
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};
