const Employee = require('./models/employee.model');
const Leave = require('./models/leave.model');
const Payroll = require('./models/payroll.model');
const Recruitment = require('./models/recruitment.model');
const Performance = require('./models/performance.model');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;

    // 1. Total Employees
    const totalEmployees = await Employee.countDocuments({ tenantCompanyId, status: 'Active' });

    // 2. On Leave Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leavesToday = await Leave.countDocuments({
      tenantCompanyId,
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // 3. Pending Approvals (Leaves)
    const pendingLeaves = await Leave.countDocuments({ tenantCompanyId, status: 'Pending' });

    // 4. Payroll This Month
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const payrolls = await Payroll.find({ tenantCompanyId, month: currentMonth });
    const totalPayroll = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);

    // 5. Avg Performance (Latest cycle)
    const performances = await Performance.find({ tenantCompanyId, status: 'Completed' }).sort({ createdAt: -1 }).limit(100);
    const avgPerformance = performances.length > 0 
      ? (performances.reduce((acc, p) => acc + (p.rating || 0), 0) / performances.length).toFixed(1)
      : 0;

    // 6. Open Positions
    const openPositions = await Recruitment.countDocuments({ tenantCompanyId, status: 'Open' });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        leavesToday,
        pendingApprovals: pendingLeaves, // can add expense pending here too later
        totalPayroll,
        avgPerformance,
        openPositions
      }
    });
  } catch (error) {
    next(error);
  }
};
