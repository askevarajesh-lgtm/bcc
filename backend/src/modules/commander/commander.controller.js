const User = require('../auth/user.model');
const SlaRecord = require('../sla/sla.model');
const Task = require('../tasks/task.model');
const Department = require('../departments/department.model');

exports.getCommandCenterData = async (req, res, next) => {
  try {
    // 1. Build scoping filters
    let clientQuery = { 
      role: { $in: ['agency_super_admin', 'brand_super_admin'] }, 
      status: 'active' 
    };
    let allRelatedUserIds = [];

    if (req.user && req.user.role === 'commander_admin') {
      clientQuery.createdBy = req.user._id;
      
      // First, get all clients created by this commander
      const relatedClients = await User.find({ createdBy: req.user._id }, '_id');
      const clientIds = relatedClients.map(c => c._id);
      
      // Then, get all users that belong to those clients (agencies and brands)
      const relatedUsers = await User.find({ 
        $or: [
          { agencyId: { $in: clientIds } }, 
          { brandId: { $in: clientIds } },
          { _id: { $in: clientIds } }
        ] 
      }, '_id');
      
      allRelatedUserIds = relatedUsers.map(u => u._id);
      allRelatedUserIds.push(req.user._id);
    }

    // Active Clients (Agencies and direct Brands)
    const activeClientsDocs = await User.find(clientQuery);
    const activeClientsCount = activeClientsDocs.length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // SLAs
    let slaQuery = {};
    if (req.user && req.user.role === 'commander_admin') {
      slaQuery = {
        $or: [
          { clientId: { $in: allRelatedUserIds } },
          { agencyId: { $in: allRelatedUserIds } },
          { assignedTo: { $in: allRelatedUserIds } }
        ]
      };
    }
    const slas = await SlaRecord.find(slaQuery).populate('clientId', 'name companyName');
    
    // SLA Compliance
    const totalSlas = slas.length;
    const resolvedSlas = slas.filter(s => s.status === 'Resolved').length;
    const slaCompliance = totalSlas > 0 ? Math.round((resolvedSlas / totalSlas) * 100) : 100;
    
    // Open Escalations
    const openEscalations = slas.filter(s => 
      ['Critical', 'Urgent'].includes(s.priority) && s.status !== 'Resolved'
    ).length;

    // Alerts & Escalations List
    const alertsData = slas
      .filter(s => s.status !== 'Resolved')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(s => {
        let type = 'warning';
        if (s.priority === 'Critical' || s.priority === 'Urgent') type = 'critical';
        return {
          id: s._id,
          type,
          client: s.clientId?.companyName || s.clientId?.name || 'Unknown',
          time: new Date(s.createdAt).toLocaleDateString(),
          desc: s.title || s.description,
          action: 'Resolve'
        };
      });

    // Execution Activity (Tasks last 30 days) - Move this up so we can use it for MOS calculation
    let taskQuery = { createdAt: { $gte: thirtyDaysAgo } };
    if (req.user && req.user.role === 'commander_admin') {
      taskQuery.tenantCompanyId = { $in: allRelatedUserIds };
    }
    const recentTasks = await Task.find(taskQuery);

    // Client MOS Leaderboard
    const topClients = activeClientsDocs.map(c => {
      const clientIdStr = c._id.toString();
      
      // SLA compliance for this client
      const clientSlas = slas.filter(s => 
        s.clientId?._id?.toString() === clientIdStr || 
        s.clientId?.toString() === clientIdStr ||
        s.agencyId?.toString() === clientIdStr
      );
      let slaScore = 100;
      if (clientSlas.length > 0) {
        const resolved = clientSlas.filter(s => s.status === 'Resolved').length;
        slaScore = Math.round((resolved / clientSlas.length) * 100);
      }

      // Task completion for this client
      const clientTasks = recentTasks.filter(t => t.tenantCompanyId?.toString() === clientIdStr);
      let taskScore = 100;
      if (clientTasks.length > 0) {
        const completed = clientTasks.filter(t => ['done', 'completed', 'complete'].includes(t.status?.toLowerCase())).length;
        taskScore = Math.round((completed / clientTasks.length) * 100);
      }

      // Real MOS is average of SLA and Task completion
      const hasSla = clientSlas.length > 0;
      const hasTask = clientTasks.length > 0;
      
      let realMos = 100; // Default to 100 if no data (perfect health)
      if (hasSla && hasTask) {
        realMos = Math.round((slaScore + taskScore) / 2);
      } else if (hasSla) {
        realMos = slaScore;
      } else if (hasTask) {
        realMos = taskScore;
      }

      return {
        id: (c.companyName || c.name || 'C').substring(0, 2).toUpperCase(),
        name: c.companyName || c.name || 'Client',
        industry: c.industry || 'Digital',
        mos: realMos,
        status: realMos >= 80 ? 'healthy' : (realMos >= 70 ? 'renewal' : 'at risk')
      };
    }).sort((a, b) => b.mos - a.mos).slice(0, 7);

    // Avg MOS Score
    const avgMosScore = topClients.length > 0 
      ? Math.round(topClients.reduce((acc, curr) => acc + curr.mos, 0) / topClients.length)
      : 100; // Fallback default

    // Group recent tasks into 4 weeks
    const week1Start = new Date(thirtyDaysAgo);
    const week2Start = new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000);
    const week3Start = new Date(thirtyDaysAgo.getTime() + 14 * 24 * 60 * 60 * 1000);
    const week4Start = new Date(thirtyDaysAgo.getTime() + 21 * 24 * 60 * 60 * 1000);

    const week1Tasks = recentTasks.filter(t => t.createdAt >= week1Start && t.createdAt < week2Start);
    const week2Tasks = recentTasks.filter(t => t.createdAt >= week2Start && t.createdAt < week3Start);
    const week3Tasks = recentTasks.filter(t => t.createdAt >= week3Start && t.createdAt < week4Start);
    const week4Tasks = recentTasks.filter(t => t.createdAt >= week4Start);

    const countCompleted = (tasks) => tasks.filter(t => ['done', 'completed', 'complete'].includes(t.status?.toLowerCase())).length;

    const executionActivityData = [
      { name: 'Week 1', completed: countCompleted(week1Tasks), total: week1Tasks.length },
      { name: 'Week 2', completed: countCompleted(week2Tasks), total: week2Tasks.length },
      { name: 'Week 3', completed: countCompleted(week3Tasks), total: week3Tasks.length },
      { name: 'Week 4', completed: countCompleted(week4Tasks), total: week4Tasks.length },
    ];

    const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
    const deptIdsToResolve = [
      ...new Set(
        recentTasks
          .map((t) => t.department)
          .filter((dept) => dept && OBJECT_ID_RE.test(dept)),
      ),
    ];

    let departmentNameById = {};
    if (deptIdsToResolve.length > 0) {
      const departmentDocs = await Department.find(
        { _id: { $in: deptIdsToResolve } },
        'name slug',
      );
      departmentNameById = departmentDocs.reduce((acc, d) => {
        acc[d._id.toString()] = d.name || d.slug;
        return acc;
      }, {});
    }

    const resolveDeptName = (dept) => {
      if (!dept) return 'Other';
      if (OBJECT_ID_RE.test(dept)) {
        return departmentNameById[dept] || 'Unassigned Department';
      }
      return dept;
    };

    const deptCounts = recentTasks.reduce((acc, t) => {
      const dept = resolveDeptName(t.department);
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    const colors = ['var(--accent-secondary)', 'var(--accent-primary)', '#8b5cf6', '#ec4899', '#f59e0b'];
    const teamUtilisationData = Object.keys(deptCounts).map((dept, idx) => ({
      name: dept,
      value: deptCounts[dept],
      fill: colors[idx % colors.length]
    }));
    // If no data, provide a fallback so the pie chart doesn't break
    if (teamUtilisationData.length === 0) {
      teamUtilisationData.push({ name: 'No Data', value: 1, fill: 'var(--bg-tertiary)' });
    }

    // Team Capacity (Users with most tasks)
    let capacityUserQuery = { 
      status: 'active', 
      role: { $in: ['agency_manager', 'agency_client', 'brand_manager', 'brand_team_user', 'brand_client'] } 
    };
    if (req.user && req.user.role === 'commander_admin') {
      capacityUserQuery._id = { $in: allRelatedUserIds };
    }
    const allUsers = await User.find(capacityUserQuery).limit(20);
    const teamCapacityData = [];
    
    for (let i = 0; i < Math.min(3, allUsers.length); i++) {
      const u = allUsers[i];
      const userTasks = await Task.find({ assignees: u._id });
      const completed = countCompleted(userTasks);
      const total = userTasks.length;
      
      teamCapacityData.push({
        name: u.name || u.firstName || 'User',
        initials: (u.name || u.firstName || 'U').substring(0, 2).toUpperCase(),
        logged: completed,
        capacity: total > 0 ? total : 1, // Avoid 0 denominator
        color: colors[i % colors.length]
      });
    }
    // If no users, provide a fallback
    if (teamCapacityData.length === 0) {
      teamCapacityData.push({
        name: 'No Active Users',
        initials: 'NA',
        logged: 0,
        capacity: 1,
        color: 'var(--accent-secondary)'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        activeClients: activeClientsCount,
        avgMosScore,
        slaCompliance,
        openEscalations,
        topClients,
        alertsData,
        executionActivityData,
        teamUtilisationData,
        teamCapacityData
      }
    });

  } catch (error) {
    next(error);
  }
};