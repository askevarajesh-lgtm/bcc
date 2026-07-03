const TimeEntry = require('./timeTracking.model');
const User = require('../auth/user.model');
const Task = require('../tasks/task.model');
const mongoose = require('mongoose');

exports.logTime = async (req, res) => {
  try {
    const { employee, client, task, moduleName, description, date, hours, isBillable } = req.body;
    const tenantCompanyId = req.companyId;

    const newEntry = new TimeEntry({
      employee,
      client,
      task,
      moduleName,
      description,
      date,
      hours: Number(hours),
      isBillable,
      tenantCompanyId,
      createdBy: req.user._id
    });

    await newEntry.save();

    // If task is provided, we can optionally update task.timeSpent
    if (task) {
      await Task.findByIdAndUpdate(task, { $inc: { timeSpent: Number(hours) } });
    }

    res.status(201).json({ success: true, message: 'Time logged successfully', data: newEntry });
  } catch (error) {
    console.error('Error logging time:', error);
    res.status(500).json({ success: false, message: 'Failed to log time', error: error.message });
  }
};

exports.getRecentEntries = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    
    // Role based filtering
    let matchQuery = { tenantCompanyId };
    if (['user', 'brand_team_user', 'agency_client', 'brand_manager', 'brand_super_admin'].includes(req.user.role)) {
      matchQuery.employee = req.user._id;
    }

    const entries = await TimeEntry.find(matchQuery)
      .populate('employee', 'name name')
      .populate('client', 'name companyName')
      .populate('task', 'title')
      .sort({ date: -1, createdAt: -1 })
      .limit(20);

    const formatted = entries.map(e => ({
      id: e._id,
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      member: e.employee?.name || 'Unknown',
      memberInit: e.employee?.name?.substring(0, 2).toUpperCase() || 'UN',
      client: e.client?.companyName || e.client?.name || null,
      module: e.moduleName || 'Other',
      task: e.description || e.task?.title || 'General Work',
      hours: e.hours,
      billable: e.isBillable
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch entries', error: error.message });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const tenantObjectId = new mongoose.Types.ObjectId(tenantCompanyId);
    
    let matchQuery = { $or: [{ tenantCompanyId: tenantObjectId }, { companyId: tenantObjectId }] };
    if (['user', 'brand_team_user', 'agency_client', 'brand_manager', 'brand_super_admin'].includes(req.user.role)) {
      matchQuery.employee = req.user._id;
    }

    // Date range: current week (Monday to Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay() || 7; // Get current day number, converting Sun. to 7
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - day + 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const weekMatch = { ...matchQuery, date: { $gte: startOfWeek, $lte: endOfWeek } };
    const monthMatch = { ...matchQuery, date: { $gte: startOfMonth, $lte: endOfMonth } };

    // 1. TimeEntry KPIs
    const kpiAggregation = await TimeEntry.aggregate([
      { $match: weekMatch },
      { $group: {
        _id: null,
        totalHours: { $sum: "$hours" },
        billableHours: { $sum: { $cond: [{ $eq: ["$isBillable", true] }, "$hours", 0] } },
        nonBillableHours: { $sum: { $cond: [{ $eq: ["$isBillable", false] }, "$hours", 0] } }
      }}
    ]);

    let kpi = kpiAggregation[0] || { totalHours: 0, billableHours: 0, nonBillableHours: 0 };
    
    // Calculate Task KPIs based on task completions this week
    const completedStatuses = ['completed', 'done', 'validated', 'complete', 'review', 'REVIEW'];
    let taskMatch = { 
      $or: [{ tenantCompanyId: tenantObjectId }, { companyId: tenantObjectId }], 
      status: { $in: completedStatuses },
      updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
    };
    if (['user', 'brand_team_user', 'agency_client', 'brand_manager', 'brand_super_admin'].includes(req.user.role)) {
      taskMatch.assignedTo = req.user._id;
    }

    const taskKpiAgg = await Task.aggregate([
      { $match: taskMatch },
      { $group: {
        _id: null,
        totalTaskHours: { $sum: { $ifNull: ["$timeSpent", { $divide: ["$workDurationMinutes", 60] }] } }
      }}
    ]);

    if (taskKpiAgg[0] && taskKpiAgg[0].totalTaskHours) {
      const taskHours = parseFloat(taskKpiAgg[0].totalTaskHours.toFixed(1));
      kpi.totalHours += taskHours;
      kpi.billableHours += taskHours; // Assuming task-derived time is billable by default
    }

    let capacity = 320; 
    if (['user', 'brand_team_user', 'agency_client'].includes(req.user.role)) {
       capacity = 40;
    }

    const utilizationRate = kpi.totalHours > 0 ? Math.round((kpi.billableHours / capacity) * 100) : 0;

    const kpiCards = {
      totalHours: parseFloat(kpi.totalHours.toFixed(1)),
      capacity,
      billableHours: parseFloat(kpi.billableHours.toFixed(1)),
      nonBillableHours: parseFloat(kpi.nonBillableHours.toFixed(1)),
      billablePercent: kpi.totalHours > 0 ? Math.round((kpi.billableHours / kpi.totalHours) * 100) : 0,
      nonBillablePercent: kpi.totalHours > 0 ? Math.round((kpi.nonBillableHours / kpi.totalHours) * 100) : 0,
      utilizationRate: utilizationRate > 100 ? 100 : utilizationRate
    };

    // 2. Weekly Timesheet
    const timesheetAgg = await TimeEntry.aggregate([
      { $match: weekMatch },
      { $group: {
        _id: { employee: "$employee", dayOfWeek: { $isoDayOfWeek: "$date" } },
        hours: { $sum: "$hours" }
      }}
    ]);

    const taskTimesheetAgg = await Task.aggregate([
      { $match: { ...taskMatch, assignedTo: { $ne: null } } },
      { $group: {
        _id: { employee: "$assignedTo", dayOfWeek: { $isoDayOfWeek: { $ifNull: ["$workCompletedAt", "$updatedAt"] } } },
        hours: { $sum: { $ifNull: ["$timeSpent", { $divide: ["$workDurationMinutes", 60] }] } }
      }}
    ]);

    // Merge both Timesheet Data
    const allTimesheetAgg = [];
    const mergeIntoAgg = (items) => {
      items.forEach(item => {
        if (!item._id || !item._id.employee || !item._id.dayOfWeek) return;
        const existing = allTimesheetAgg.find(e => e._id.employee.toString() === item._id.employee.toString() && e._id.dayOfWeek === item._id.dayOfWeek);
        if (existing) {
          existing.hours += item.hours;
        } else {
          allTimesheetAgg.push({ _id: { employee: item._id.employee, dayOfWeek: item._id.dayOfWeek }, hours: item.hours });
        }
      });
    };
    mergeIntoAgg(timesheetAgg);
    mergeIntoAgg(taskTimesheetAgg);

    const usersInWeek = [...new Set(allTimesheetAgg.map(t => t._id.employee.toString()))];
    const usersInfo = await User.find({ _id: { $in: usersInWeek } }).select('name role');

    const timesheetData = usersInfo.map((u, i) => {
      const colors = ['var(--accent-warning)', 'var(--accent-primary)', 'var(--accent-info)', 'var(--accent-secondary)', 'var(--accent-danger)'];
      const empLogs = allTimesheetAgg.filter(t => t._id.employee.toString() === u._id.toString());
      
      const getDayHours = (day) => {
        const log = empLogs.find(l => l._id.dayOfWeek === day);
        return log ? parseFloat(log.hours.toFixed(1)) : '-';
      };

      const total = empLogs.reduce((sum, log) => sum + log.hours, 0);

      return {
        name: u.name,
        role: u.role,
        initials: u.name ? u.name.substring(0, 2).toUpperCase() : 'UN',
        color: colors[i % colors.length],
        mon: getDayHours(1),
        tue: getDayHours(2),
        wed: getDayHours(3),
        thu: getDayHours(4),
        fri: getDayHours(5),
        sat: getDayHours(6),
        sun: getDayHours(7),
        total: parseFloat(total.toFixed(1))
      };
    });

    // 3. Time by Client (this month)
    const clientAgg = await TimeEntry.aggregate([
      { $match: monthMatch },
      { $match: { client: { $ne: null } } },
      { $group: {
        _id: "$client",
        billable: { $sum: { $cond: [{ $eq: ["$isBillable", true] }, "$hours", 0] } },
        nonBillable: { $sum: { $cond: [{ $eq: ["$isBillable", false] }, "$hours", 0] } }
      }}
    ]);

    const clientsInMonth = [...new Set(clientAgg.map(c => c._id.toString()))];
    const clientsInfo = await User.find({ _id: { $in: clientsInMonth } }).select('companyName name');

    const timeByClient = clientAgg.map(c => {
      const cInfo = clientsInfo.find(u => u._id.toString() === c._id.toString());
      return {
        client: cInfo ? (cInfo.companyName || cInfo.name) : 'Unknown Client',
        billable: parseFloat(c.billable.toFixed(1)),
        nonBillable: parseFloat(c.nonBillable.toFixed(1))
      };
    });

    res.status(200).json({ success: true, kpis: kpiCards, timesheet: timesheetData, timeByClient });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: error.message });
  }
};

exports.getFormOptions = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;

    // Fetch Employees
    const employees = await User.find({ tenantCompanyId, role: { $in: ['user', 'brand_team_user', 'agency_client', 'agency_manager', 'agency_super_admin'] } }).select('name role');
    
    // Fetch Clients (Brand users or direct clients)
    const clients = await User.find({ tenantCompanyId, role: { $in: ['brand_super_admin', 'brand_manager', 'client'] } }).select('companyName name');

    // Fetch Tasks
    const tasks = await Task.find({ tenantCompanyId, status: { $nin: ['completed', 'complete', 'validated', 'done', 'rejected'] } }).select('title department');

    res.status(200).json({ success: true, data: { employees, clients, tasks } });
  } catch (error) {
    console.error('Error fetching form options:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch form options' });
  }
};

exports.getTeamTaskPerformance = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    
    // Convert tenantCompanyId to ObjectId for aggregation match
    const tenantObjectId = new mongoose.Types.ObjectId(tenantCompanyId);

    const completedStatuses = ['completed', 'done', 'validated', 'complete', 'review', 'REVIEW'];
    
    const performanceAgg = await Task.aggregate([
      { 
        $match: { 
          $or: [{ tenantCompanyId: tenantObjectId }, { companyId: tenantObjectId }], 
          status: { $in: completedStatuses }, 
          assignedTo: { $ne: null } 
        } 
      },
      { 
        $group: {
          _id: "$assignedTo",
          tasksCompleted: { $sum: 1 },
          totalTimeSpentHours: { $sum: { $ifNull: ["$timeSpent", 0] } },
          totalWorkDurationMinutes: { $sum: { $ifNull: ["$workDurationMinutes", 0] } }
        }
      }
    ]);

    // Populate user details
    const userIds = performanceAgg.map(p => p._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name role');

    const performanceData = performanceAgg.map(p => {
      const u = users.find(user => user._id.toString() === p._id.toString());
      return {
        userId: p._id,
        name: u ? u.name : 'Unknown',
        role: u ? u.role : 'Member',
        tasksCompleted: p.tasksCompleted,
        // Calculate total hours based on manually logged timeSpent (hours) OR automatic workDurationMinutes (converted to hours)
        totalTimeSpent: p.totalTimeSpentHours > 0 
          ? p.totalTimeSpentHours 
          : parseFloat((p.totalWorkDurationMinutes / 60).toFixed(1))
      };
    });

    res.status(200).json({ success: true, data: performanceData });
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team performance' });
  }
};
