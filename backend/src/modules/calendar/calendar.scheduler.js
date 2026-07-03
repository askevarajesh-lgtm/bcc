const cron = require('node-cron');
const CalendarEvent = require('./models/calendarEvent.model');
const Meeting = require('../meetings/models/meeting.model');
const User = require('../auth/user.model');
const Notification = require('../tasks/notification.model');
const sendpulseService = require('../../utils/sendpulse.service');

const createInAppNotification = async (userId, type, title, message, eventId) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      metadata: { eventId: eventId.toString() },
      channels: { inApp: true, email: false }
    });
  } catch (err) {
    console.error("Failed to create scheduler notification:", err);
  }
};

const sendCalendarReminders = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // 1. Send reminders for custom events
    const upcomingEvents = await CalendarEvent.find({
      startDateTime: { $gte: now, $lte: oneHourLater },
      status: 'upcoming',
      'reminderSettings.sent': false
    });

    for (const event of upcomingEvents) {
      const attendees = [event.host, ...event.attendees].filter(Boolean);
      for (const userId of attendees) {
        await createInAppNotification(
          userId,
          'meeting_reminder',
          'Upcoming Calendar Event Reminder',
          `Reminder: "${event.title}" is starting soon at ${event.startDateTime.toLocaleTimeString()}`,
          event._id
        );

        // Optional Email Invite
        try {
          const user = await User.findById(userId);
          if (user && user.email) {
            await sendpulseService.sendEmail(
              user.email,
              `Reminder: ${event.title}`,
              `<p>This is a reminder that the calendar event <strong>${event.title}</strong> is starting soon.</p>
               <p>Start Time: ${event.startDateTime.toLocaleTimeString()}</p>
               <p>Location: ${event.location || 'N/A'}</p>`
            );
          }
        } catch (emailErr) {
          console.error("Failed to send calendar reminder email:", emailErr);
        }
      }

      event.reminderSettings.sent = true;
      await event.save();
    }

    // 2. Automatically mark past events as completed
    const pastEvents = await CalendarEvent.find({
      endDateTime: { $lt: now },
      status: 'upcoming'
    });

    for (const event of pastEvents) {
      event.status = 'completed';
      event.history.push({
        action: 'status_completed',
        performedBy: event.host,
        details: 'Automatically marked completed by scheduler cron job',
        timestamp: new Date()
      });
      await event.save();
    }

    // 3. Automatically mark past meetings as completed
    const todayStr = now.toISOString().split('T')[0];
    const pastMeetings = await Meeting.find({
      date: { $lte: new Date(todayStr) },
      status: 'upcoming'
    });

    for (const meeting of pastMeetings) {
      // Parse start and end time
      const datePart = meeting.date.toISOString().split('T')[0];
      const start = new Date(`${datePart}T${meeting.time || '10:00'}`);
      const end = new Date(start.getTime() + (meeting.duration || 30) * 60 * 1000);

      if (end < now) {
        meeting.status = 'completed';
        meeting.history.push({
          action: 'status_changed_completed',
          performedBy: meeting.host,
          details: 'Automatically marked completed by scheduler cron job'
        });
        await meeting.save();
      }
    }

  } catch (error) {
    console.error('Error in Calendar scheduler cron job:', error);
  }
};

const startCalendarScheduler = () => {
  console.log('Registering calendar reminder and auto-complete scheduler job...');
  // Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running Calendar scheduler job...');
    await sendCalendarReminders();
  });
};

module.exports = startCalendarScheduler;
