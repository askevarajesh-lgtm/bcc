const Leave = require('./models/leave.model');

exports.getLeaves = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const query = { tenantCompanyId };
    
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.status) query.status = req.query.status;

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName profilePhoto employeeCode departmentId designationId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    next(error);
  }
};

exports.applyLeave = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      tenantCompanyId,
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "Pending"
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { status, rejectionReason, approvedBy } = req.body;

    const leave = await Leave.findOne({ _id: req.params.id, tenantCompanyId });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    if (status === 'Rejected') {
      leave.rejectionReason = rejectionReason;
    }
    if (status === 'Approved' && approvedBy) {
       // In a real scenario, this would be `req.user.employeeId` if users and employees are linked
       // For now, we will trust the `approvedBy` passed or leave it null.
       leave.approvedBy = approvedBy;
    }

    await leave.save();

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
};
