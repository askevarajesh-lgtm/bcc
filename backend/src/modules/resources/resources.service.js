const TimeEntry = require('../timeTracking/timeTracking.model');
const User = require('../auth/user.model');
const Task = require('../tasks/task.model');
const mongoose = require('mongoose');

const getDashboardData = async (tenantCompanyId, userRole, userId, filterMonth) => {
  const tenantObjectId = new mongoose.Types.ObjectId(tenantCompanyId);
  const employeeMatch = { tenantCompanyId, role: { $in: ['user', 'brand_team_user', 'agency_client', 'agency_manager', 'agency_super_admin'] } };

  const now = filterMonth ? new Date(filterMonth) : new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  let employees = await User.find(employeeMatch).select('name role status');
  if (['user', 'brand_team_user', 'agency_client'].includes(userRole)) {
    employees = employees.filter(e => e._id.toString() === userId.toString());
  }
  
  const empIds = employees.map(e => e._id);

  const defaultMonthlyCapacity = 160;
  const totalCapacity = employees.length * defaultMonthlyCapacity;

  const timeEntries = await TimeEntry.find({
    tenantCompanyId,
    employee: { $in: empIds },
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).populate('client', 'companyName name');

  const completedStatuses = ['completed', 'done', 'validated', 'complete', 'review', 'REVIEW'];
  const tasks = await Task.find({
    $or: [{ tenantCompanyId: tenantObjectId }, { companyId: tenantObjectId }],
    assignedTo: { $in: empIds },
    status: { $in: completedStatuses },
    updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const utilMap = {};
  employees.forEach(e => {
    utilMap[e._id.toString()] = {
      id: e._id,
      name: e.name,
      role: e.role || 'Member',
      cap: defaultMonthlyCapacity,
      bill: 0,
      nonBill: 0,
    };
  });

  timeEntries.forEach(entry => {
    const eid = entry.employee._id.toString();
    if (utilMap[eid]) {
      if (entry.isBillable) utilMap[eid].bill += entry.hours;
      else utilMap[eid].nonBill += entry.hours;
    }
  });

  tasks.forEach(task => {
    const eid = task.assignedTo.toString();
    if (utilMap[eid]) {
      const h = task.timeSpent || (task.workDurationMinutes / 60) || 0;
      utilMap[eid].bill += h;
    }
  });

  let allocated = 0;
  let overallocatedCount = 0;
  const teamUtilisation = Object.values(utilMap).map(u => {
    const totalWorked = u.bill + u.nonBill;
    allocated += totalWorked;
    if (totalWorked > u.cap) overallocatedCount++;
    return {
      ...u,
      bill: parseFloat(u.bill.toFixed(1)),
      nonBill: parseFloat(u.nonBill.toFixed(1)),
      free: parseFloat(Math.max(0, u.cap - totalWorked).toFixed(1)),
      util: totalWorked > 0 ? Math.round((totalWorked / u.cap) * 100) : 0
    };
  });

  const available = Math.max(0, totalCapacity - allocated);

  const clientMap = {};
  employees.forEach(e => clientMap[e._id.toString()] = {});
  
  const clientNames = {};

  timeEntries.forEach(entry => {
    const eid = entry.employee._id.toString();
    if (entry.client) {
      const cid = entry.client._id.toString();
      clientNames[cid] = entry.client.companyName || entry.client.name;
      if (!clientMap[eid][cid]) clientMap[eid][cid] = 0;
      clientMap[eid][cid] += entry.hours;
    }
  });

  tasks.forEach(task => {
    const eid = task.assignedTo.toString();
    if (task.companyId) {
      const cid = task.companyId.toString();
      if (!clientMap[eid][cid]) clientMap[eid][cid] = 0;
      clientMap[eid][cid] += (task.timeSpent || (task.workDurationMinutes / 60) || 0);
    }
  });
  
  const missingClientIds = [...new Set(tasks.map(t => t.companyId?.toString()).filter(Boolean))].filter(id => !clientNames[id]);
  if (missingClientIds.length > 0) {
    const missingClients = await User.find({ _id: { $in: missingClientIds } }).select('name companyName');
    missingClients.forEach(c => clientNames[c._id.toString()] = c.companyName || c.name);
  }

  const clientAllocationData = employees.map(e => {
    const eid = e._id.toString();
    const row = { id: eid, name: e.name.split(' ')[0], total: 0 };
    Object.keys(clientMap[eid]).forEach(cid => {
      const cName = clientNames[cid] || 'Others';
      const h = parseFloat(clientMap[eid][cid].toFixed(1));
      if (!row[cName]) row[cName] = 0;
      row[cName] += h;
      row.total += h;
    });
    row.total = parseFloat(row.total.toFixed(1));
    return row;
  });
  
  const activeClientNames = [...new Set(Object.values(clientNames))];

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calendarData = [];
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59);
    const isWeekend = dayStart.getDay() === 0 || dayStart.getDay() === 6;

    const dayUsers = employees.map(e => {
      if (isWeekend) return { id: e._id, status: 'var(--text-tertiary)' };
      const eid = e._id.toString();
      let hoursToday = 0;
      timeEntries.filter(te => te.employee._id.toString() === eid && new Date(te.date).getDate() === d).forEach(te => hoursToday += te.hours);
      tasks.filter(t => t.assignedTo.toString() === eid && t.updatedAt >= dayStart && t.updatedAt <= dayEnd).forEach(t => hoursToday += (t.timeSpent || (t.workDurationMinutes / 60) || 0));
      
      let status = 'var(--accent-primary)';
      if (hoursToday >= 8) status = 'var(--accent-danger)';
      else if (hoursToday >= 4) status = 'var(--accent-warning)';
      
      return { id: e._id, status };
    });
    calendarData.push({ day: d, users: dayUsers });
  }

  return {
    kpis: {
      totalCapacity: totalCapacity,
      allocated: parseFloat(allocated.toFixed(1)),
      allocatedPercent: totalCapacity > 0 ? Math.round((allocated / totalCapacity) * 100) : 0,
      available: parseFloat(available.toFixed(1)),
      availablePercent: totalCapacity > 0 ? Math.round((available / totalCapacity) * 100) : 0,
      overallocatedCount,
      membersCount: employees.length
    },
    teamUtilisation,
    clientAllocation: {
      data: clientAllocationData,
      columns: activeClientNames
    },
    availabilityCalendar: calendarData
  };
};

module.exports = {
  getDashboardData
};
