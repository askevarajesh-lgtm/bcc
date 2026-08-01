const CalendarEvent = require('./models/calendarEvent.model');
const EventNote = require('./models/eventNote.model');
const EventAttachment = require('./models/eventAttachment.model');
const Meeting = require('../meetings/models/meeting.model');
const Task = require('../tasks/task.model');
const Lead = require('../leads/lead.model');
const User = require('../auth/user.model');
const mongoose = require('mongoose');

// Helper to determine scoping query based on user role
const getScopingFilters = (userRole, userId, companyId) => {
  const eventFilter = {};
  const meetingFilter = {};
  const taskFilter = {};
  const leadFilter = {};

  // For Super Admins, Commander Admins
  if (['supreme_super_admin', 'commander_admin'].includes(userRole)) {
    if (companyId) {
      eventFilter.companyId = companyId;
      meetingFilter.companyId = companyId;
      taskFilter.tenantCompanyId = companyId;
      leadFilter.companyId = companyId;
    }
    return { eventFilter, meetingFilter, taskFilter, leadFilter };
  }

  // For Agency Admins / Managers
  if (['agency_super_admin', 'agency_manager'].includes(userRole)) {
    eventFilter.companyId = companyId;
    meetingFilter.companyId = companyId;
    taskFilter.tenantCompanyId = companyId;
    leadFilter.companyId = companyId;
    return { eventFilter, meetingFilter, taskFilter, leadFilter };
  }

  // For Brand Admins / Managers (Client side)
  if (['brand_super_admin', 'brand_manager'].includes(userRole)) {
    eventFilter.$or = [{ companyId }, { clientId: companyId }];
    meetingFilter.$or = [{ companyId }, { clientId: companyId }];
    taskFilter.companyId = companyId;
    leadFilter.clientId = companyId;
    return { eventFilter, meetingFilter, taskFilter, leadFilter };
  }

  // For Client
  if (userRole === 'agency_client' || userRole === 'client') {
    eventFilter.$or = [{ clientId: companyId }, { attendees: userId }];
    meetingFilter.$or = [{ clientId: companyId }, { participants: userId }];
    taskFilter.companyId = companyId;
    leadFilter.clientId = companyId;
    return { eventFilter, meetingFilter, taskFilter, leadFilter };
  }

  // For regular employee / team member
  eventFilter.companyId = companyId;
  eventFilter.$or = [{ host: userId }, { attendees: userId }];

  meetingFilter.companyId = companyId;
  meetingFilter.$or = [{ host: userId }, { participants: userId }];

  taskFilter.tenantCompanyId = companyId;
  taskFilter.assignedTo = userId;

  leadFilter.companyId = companyId;
  leadFilter.assignedTo = userId;

  return { eventFilter, meetingFilter, taskFilter, leadFilter };
};

const calendarService = {
  // Create a new custom calendar event
  createEvent: async (eventData, companyId, userId) => {
    const event = new CalendarEvent({
      ...eventData,
      companyId,
      host: eventData.host || userId,
      history: [{
        action: 'create',
        performedBy: userId,
        details: `Event created: "${eventData.title}"`,
        timestamp: new Date()
      }]
    });

    await event.save();
    return event;
  },

  // Get all events from custom events, meetings, tasks, and lead followups
  getAllEvents: async (companyId, query, userRole, userId) => {
    const { startDate, endDate, eventType, search, clientId, hostId } = query;
    const { eventFilter, meetingFilter, taskFilter, leadFilter } = getScopingFilters(userRole, userId, companyId);

    // Apply date range filters if present
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      eventFilter.startDateTime = { $gte: start, $lte: end };
      meetingFilter.date = { $gte: start, $lte: end };
      taskFilter.dueDate = { $gte: start, $lte: end };
      leadFilter.nextFollowUpDate = { $gte: start, $lte: end };
    }

    // Apply Client Filter
    if (clientId) {
      eventFilter.clientId = clientId;
      meetingFilter.clientId = clientId;
      taskFilter.companyId = clientId;
      leadFilter.clientId = clientId;
    }

    // Apply Host / AssignedTo Filter
    if (hostId) {
      eventFilter.host = hostId;
      meetingFilter.host = hostId;
      taskFilter.assignedTo = hostId;
      leadFilter.assignedTo = hostId;
    }

    // 1. Fetch custom events
    const customEvents = await CalendarEvent.find(eventFilter)
      .populate('host', 'name email logo')
      .populate('attendees', 'name email logo')
      .populate('clientId', 'name companyName')
      .populate('projectId', 'name')
      .populate('taskId', 'title status');

    const mappedCustom = customEvents.map(e => {
      const obj = e.toObject();
      obj.source = 'custom';
      return obj;
    });

    // 2. Fetch meetings
    const meetings = await Meeting.find(meetingFilter)
      .populate('host', 'name email logo')
      .populate('participants', 'name email logo')
      .populate('clientId', 'name companyName')
      .populate('projectId', 'name');

    const mappedMeetings = meetings.map(m => {
      const dateStr = m.date.toISOString().split('T')[0];
      const start = new Date(`${dateStr}T${m.time || '09:00'}`);
      const end = new Date(start.getTime() + (m.duration || 30) * 60 * 1000);

      return {
        _id: m._id,
        title: `[Meeting] ${m.title}`,
        eventType: m.meetingType || 'team_meeting',
        startDateTime: start,
        endDateTime: end,
        location: m.meetingLink ? 'Virtual / Meeting Link' : 'Office',
        meetingLink: m.meetingLink,
        host: m.host,
        attendees: m.participants,
        status: m.status,
        companyId: m.companyId,
        clientId: m.clientId,
        leadId: m.leadId,
        projectId: m.projectId,
        meetingId: m._id,
        isInternal: !m.clientId,
        source: 'meeting',
        notes: m.agenda
      };
    });

    // 3. Fetch tasks (due dates act as deliverables/milestones)
    taskFilter.dueDate = taskFilter.dueDate || { $ne: null };
    const tasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email logo')
      .populate('projectId', 'name')
      .populate('companyId', 'name companyName');

    const mappedTasks = tasks.map(t => {
      const start = t.startDate ? new Date(t.startDate) : new Date(t.dueDate);
      const end = new Date(t.dueDate);

      return {
        _id: t._id,
        title: `[Task] ${t.title}`,
        eventType: 'content_approval', // Maps tasks as deliverable/approvals
        startDateTime: start,
        endDateTime: end,
        location: 'Task Board',
        host: t.assignedTo?.[0] || null,
        attendees: t.assignedTo || [],
        status: t.status === 'done' || t.status === 'completed' || t.status === 'validated' ? 'completed' : 'upcoming',
        companyId: t.tenantCompanyId,
        clientId: t.companyId,
        projectId: t.projectId,
        taskId: t._id,
        isInternal: !t.companyId,
        source: 'task',
        notes: t.description
      };
    });

    // 4. Fetch CRM lead reminders
    leadFilter.nextFollowUpDate = leadFilter.nextFollowUpDate || { $ne: null };
    const leads = await Lead.find(leadFilter)
      .populate('assignedTo', 'name email logo');

    const mappedLeads = leads.map(l => {
      const start = new Date(l.nextFollowUpDate);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      return {
        _id: l._id,
        title: `[Lead Followup] ${l.fullName}`,
        eventType: 'sales_call',
        startDateTime: start,
        endDateTime: end,
        location: 'CRM Call',
        host: l.assignedTo,
        attendees: l.assignedTo ? [l.assignedTo] : [],
        status: 'upcoming',
        companyId: l.companyId,
        leadId: l._id,
        isInternal: false,
        source: 'lead',
        notes: `CRM lead followup with ${l.companyName || 'Prospect'}`
      };
    });

    // Combine everything
    let allEvents = [...mappedCustom, ...mappedMeetings, ...mappedTasks, ...mappedLeads];

    // Filter by type if specified
    if (eventType) {
      allEvents = allEvents.filter(e => e.eventType === eventType);
    }

    // Filter by search string
    if (search) {
      const searchLower = search.toLowerCase();
      allEvents = allEvents.filter(e => 
        e.title.toLowerCase().includes(searchLower) ||
        (e.notes && e.notes.toLowerCase().includes(searchLower)) ||
        (e.location && e.location.toLowerCase().includes(searchLower))
      );
    }

    // Sort by startDateTime
    allEvents.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    return allEvents;
  },

  // Get single event details (support custom events and inline populates)
  getEventById: async (eventId, companyId, userRole, userId) => {
    // If it's a meeting ID, fetch from meetings
    let event = await CalendarEvent.findById(eventId)
      .populate('host', 'name email logo')
      .populate('attendees', 'name email logo')
      .populate('clientId', 'name companyName')
      .populate('projectId', 'name')
      .populate('taskId', 'title status');

    if (!event) {
      // Try to find in meetings
      const meeting = await Meeting.findById(eventId)
        .populate('host', 'name email logo')
        .populate('participants', 'name email logo')
        .populate('clientId', 'name companyName')
        .populate('projectId', 'name');

      if (meeting) {
        const dateStr = meeting.date.toISOString().split('T')[0];
        const start = new Date(`${dateStr}T${meeting.time || '09:00'}`);
        const end = new Date(start.getTime() + (meeting.duration || 30) * 60 * 1000);

        return {
          event: {
            _id: meeting._id,
            title: `[Meeting] ${meeting.title}`,
            eventType: meeting.meetingType || 'team_meeting',
            startDateTime: start,
            endDateTime: end,
            location: meeting.meetingLink ? 'Virtual / Meeting Link' : 'Office',
            meetingLink: meeting.meetingLink,
            host: meeting.host,
            attendees: meeting.participants,
            status: meeting.status,
            companyId: meeting.companyId,
            clientId: meeting.clientId,
            leadId: meeting.leadId,
            projectId: meeting.projectId,
            meetingId: meeting._id,
            isInternal: !meeting.clientId,
            source: 'meeting',
            notes: meeting.agenda,
            history: meeting.history
          },
          notes: [],
          attachments: []
        };
      }

      // Try to find in tasks
      const task = await Task.findById(eventId)
        .populate('assignedTo', 'name email logo')
        .populate('projectId', 'name')
        .populate('companyId', 'name companyName');

      if (task) {
        const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
        const end = new Date(task.dueDate);

        return {
          event: {
            _id: task._id,
            title: `[Task] ${task.title}`,
            eventType: 'content_approval',
            startDateTime: start,
            endDateTime: end,
            location: 'Task Board',
            host: task.assignedTo?.[0] || null,
            attendees: task.assignedTo || [],
            status: task.status === 'done' || task.status === 'completed' || task.status === 'validated' ? 'completed' : 'upcoming',
            companyId: task.tenantCompanyId,
            clientId: task.companyId,
            projectId: task.projectId,
            taskId: task._id,
            isInternal: !task.companyId,
            source: 'task',
            notes: task.description,
            history: []
          },
          notes: [],
          attachments: []
        };
      }

      throw new Error('Event not found');
    }

    const notes = await EventNote.find({ eventId }).populate('createdBy', 'name email');
    const attachments = await EventAttachment.find({ eventId }).populate('uploadedBy', 'name email');

    return { event, notes, attachments };
  },

  // Edit / Update event
  updateEvent: async (eventId, updateData, companyId, userId) => {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: eventId, companyId },
      { 
        ...updateData,
        $push: {
          history: {
            action: 'update',
            performedBy: userId,
            details: 'Event details updated',
            timestamp: new Date()
          }
        }
      },
      { returnDocument: 'after' }
    );

    if (!event) throw new Error('Event not found or unauthorized');
    return event;
  },

  // Delete calendar event
  deleteEvent: async (eventId, companyId) => {
    const event = await CalendarEvent.findOneAndDelete({ _id: eventId, companyId });
    if (!event) throw new Error('Event not found');
    
    // Cleanup linked notes/attachments
    await EventNote.deleteMany({ eventId });
    await EventAttachment.deleteMany({ eventId });
    return event;
  },

  // Update event status
  updateEventStatus: async (eventId, status, companyId, userId) => {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: eventId, companyId },
      { 
        status,
        $push: {
          history: {
            action: `status_${status}`,
            performedBy: userId,
            details: `Status updated to ${status}`,
            timestamp: new Date()
          }
        }
      },
      { returnDocument: 'after' }
    );

    if (!event) throw new Error('Event not found');
    return event;
  },

  // Add note
  addEventNote: async (eventId, noteData, companyId, userId) => {
    const note = new EventNote({
      eventId,
      content: noteData.content,
      createdBy: userId
    });
    await note.save();
    return note;
  },

  // Add attachment
  addEventAttachment: async (eventId, attachmentData, companyId, userId) => {
    const attachment = new EventAttachment({
      eventId,
      url: attachmentData.url,
      fileName: attachmentData.fileName,
      fileType: attachmentData.fileType || 'link',
      uploadedBy: userId
    });
    await attachment.save();
    return attachment;
  },

  // Compute analytics
  getCalendarAnalytics: async (companyId, userRole, userId) => {
    const { eventFilter, meetingFilter, taskFilter } = getScopingFilters(userRole, userId, companyId);
    
    const customCount = await CalendarEvent.countDocuments(eventFilter);
    const meetingCount = await Meeting.countDocuments(meetingFilter);
    
    taskFilter.dueDate = { $ne: null };
    const taskCount = await Task.countDocuments(taskFilter);

    // Compute status stats for Custom Events
    const customUpcoming = await CalendarEvent.countDocuments({ ...eventFilter, status: 'upcoming' });
    const customCompleted = await CalendarEvent.countDocuments({ ...eventFilter, status: 'completed' });
    const customCancelled = await CalendarEvent.countDocuments({ ...eventFilter, status: 'cancelled' });

    // Compute meeting status stats
    const meetingUpcoming = await Meeting.countDocuments({ ...meetingFilter, status: 'upcoming' });
    const meetingCompleted = await Meeting.countDocuments({ ...meetingFilter, status: 'completed' });
    const meetingCancelled = await Meeting.countDocuments({ ...meetingFilter, status: 'cancelled' });

    // Group custom events by type
    const typeAgg = await CalendarEvent.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
    const typeStats = {};
    typeAgg.forEach(t => {
      typeStats[t._id] = t.count;
    });

    return {
      totalEvents: customCount + meetingCount + taskCount,
      customEventsCount: customCount,
      meetingsCount: meetingCount,
      tasksCount: taskCount,
      statusStats: {
        upcoming: customUpcoming + meetingUpcoming,
        completed: customCompleted + meetingCompleted,
        cancelled: customCancelled + meetingCancelled
      },
      typeStats
    };
  }
};

module.exports = calendarService;
