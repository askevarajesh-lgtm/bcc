const SlaRecord = require('../sla/sla.model');
const User = require('../auth/user.model'); // Assuming auth.model is the User model.

exports.createSupportTicket = async (req, res, next) => {
  try {
    const { subject, details, typeOfRequest, priority, assignedToUserId } = req.body;
    const userRole = req.user ? req.user.role : null;
    
    // Find assignee
    const assignee = await User.findById(assignedToUserId);
    if (!assignee) {
      return res.status(404).json({ success: false, message: 'Assignee not found' });
    }

    // Role validation based on user role
    let allowedRoles = [];
    if (['agency_super_admin', 'agency_manager', 'brand_super_admin'].includes(userRole)) {
      allowedRoles = ['commander_admin'];
    } else if (['agency_client', 'client'].includes(userRole)) {
      allowedRoles = ['agency_super_admin', 'agency_manager'];
    } else if (userRole === 'brand_manager') {
      allowedRoles = ['brand_super_admin', 'commander_admin'];
    }

    if (!allowedRoles.includes(assignee.role)) {
      return res.status(403).json({ success: false, message: 'Cannot assign ticket to this role' });
    }

    // Create a support ticket in SLA module directly since Support acts as the SLA trigger.
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const slaId = `SUP-TKT-${Date.now().toString().slice(-4)}${randomStr}`;

    const dueDate = new Date();
    // Simple logic: Critical = 1 hour, Urgent = 4 hours, Normal = 24 hours
    if (priority === 'Critical') dueDate.setHours(dueDate.getHours() + 1);
    else if (priority === 'Urgent') dueDate.setHours(dueDate.getHours() + 4);
    else dueDate.setHours(dueDate.getHours() + 24);

    const newSla = new SlaRecord({
      slaId,
      clientId: req.user.brandId || req.user._id, 
      agencyId: assignee.agencyId || assignee._id,
      assignedTo: assignee._id,
      clientType: 'Direct User Client',
      triggerType: 'Client Issue',
      entityType: 'SupportTicket',
      title: subject,
      description: `[${typeOfRequest}] ${details}`,
      dueDate,
      priority: priority || 'Medium',
      status: 'Normal',
      activityTimeline: [{
        action: 'Ticket Assigned',
        details: `Support ticket assigned from ${req.user ? req.user.name : 'User'}`,
        createdBy: req.user ? req.user._id : null
      }]
    });

    await newSla.save();

    // Notify the assignee
    const { notifySlaEvent } = require('../sla/sla.controller');
    if (notifySlaEvent) {
      await notifySlaEvent(newSla, 'sla_triggered', 'New Support Ticket', `Ticket ${newSla.slaId} has been assigned to you: ${newSla.title}`, req.user?._id);
    }

    res.status(201).json({ success: true, data: newSla });
  } catch (error) {
    next(error);
  }
};

exports.getAssignableUsers = async (req, res, next) => {
  try {
    const userRole = req.user ? req.user.role : null;
    let allowedRoles = [];
    let matchQuery = {};

    if (['agency_super_admin', 'agency_manager', 'brand_super_admin'].includes(userRole)) {
      allowedRoles = ['commander_admin'];
    } else if (['agency_client', 'client'].includes(userRole)) {
      allowedRoles = ['agency_super_admin', 'agency_manager'];
      if (req.user && req.user.agencyId) matchQuery.agencyId = req.user.agencyId;
    } else if (userRole === 'brand_manager') {
      allowedRoles = ['brand_super_admin', 'commander_admin'];
      if (req.user && req.user.brandId) matchQuery.brandId = req.user.brandId;
    }

    matchQuery.role = { $in: allowedRoles };
    
    const users = await User.find(matchQuery).select('name role email brandId agencyId');
    
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
