const express = require('express');
const router = express.Router();

const departmentRoutes = require('./department.routes');
const designationRoutes = require('./designation.routes');
const employeeRoutes = require('./employee.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const payrollRoutes = require('./payroll.routes');
const performanceRoutes = require('./performance.routes');
const recruitmentRoutes = require('./recruitment.routes');
const trainingRoutes = require('./training.routes');
const assetRoutes = require('./asset.routes');
const analyticsRoutes = require('./analytics.routes');

router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/performance', performanceRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/training', trainingRoutes);
router.use('/assets', assetRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
