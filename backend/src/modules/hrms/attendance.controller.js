const Attendance = require('./models/attendance.model');

exports.getAttendances = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    
    // Support filtering by employee, month, date
    const query = { tenantCompanyId };
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.date) query.date = new Date(req.query.date);
    
    // For month filter e.g., YYYY-MM
    if (req.query.month) {
      const [year, month] = req.query.month.split('-');
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const attendances = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName profilePhoto employeeCode')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: attendances.length, data: attendances });
  } catch (error) {
    next(error);
  }
};

exports.clockIn = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { employeeId, location, notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    let attendance = await Attendance.findOne({ tenantCompanyId, employeeId, date: today });

    if (attendance) {
      if (attendance.clockIn) {
         return res.status(400).json({ success: false, message: 'Already clocked in for today' });
      } else {
        // Record existed for some reason (maybe marked absent/leave earlier), update it
        attendance.clockIn = new Date();
        attendance.status = "Present";
        attendance.location = location;
        attendance.notes = notes;
        await attendance.save();
      }
    } else {
      attendance = await Attendance.create({
        tenantCompanyId,
        employeeId,
        date: today,
        clockIn: new Date(),
        status: "Present",
        location,
        notes
      });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

exports.clockOut = async (req, res, next) => {
  try {
    const tenantCompanyId = req.companyId || req.user.agencyId || req.user._id;
    const { employeeId } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ tenantCompanyId, employeeId, date: today });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({ success: false, message: 'No clock-in record found for today' });
    }

    if (attendance.clockOut) {
      return res.status(400).json({ success: false, message: 'Already clocked out for today' });
    }

    attendance.clockOut = new Date();
    
    // Calculate work hours
    const durationMs = attendance.clockOut - attendance.clockIn;
    // subtract break durations
    const durationMinutes = (durationMs / (1000 * 60)) - (attendance.totalBreakDuration || 0);
    attendance.workHours = Number((durationMinutes / 60).toFixed(2));

    await attendance.save();

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};
