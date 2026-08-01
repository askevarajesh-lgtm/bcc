/**
 * monitoringNotification.service.js
 * Decoupled Notification Service.
 * Listens to WorkspaceEventBus and sends notifications (Email/Slack) based on rules.
 */
const eventBus = require('../workspaceEventBus.service');
const sendpulseService = require('../../../../utils/sendpulse.service');
const logger = require('../../../aiCore/logger.service');
const WorkspaceProject = require('../../models/workspaceProject.model');

class MonitoringNotificationService {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    eventBus.on('event', async (eventData) => {
      try {
        await this.handleNotification(eventData);
      } catch (err) {
        logger.error('MonitoringNotification', `Notification failed: ${err.message}`);
      }
    });
  }

  async handleNotification(eventData) {
    const { projectId, eventType, payload } = eventData;
    
    // Only notify on High/Critical alerts for now
    if (!['KeywordDropped', 'CWVFailed', 'SSLExpired'].includes(eventType)) return;
    if (payload?.severity !== 'High' && payload?.severity !== 'Critical') return;

    const project = await WorkspaceProject.findById(projectId);
    if (!project) return;
    
    // Fetch user/company notification preferences here in a real scenario
    // const recipients = project.notificationEmails || [];
    const recipients = ['admin@example.com']; // Placeholder

    for (const email of recipients) {
      try {
        await sendpulseService.sendEmail(
          email,
          `[${payload.severity}] SEO Alert: ${eventType} on ${project.domain}`,
          `<p>A monitoring event was detected:</p>
           <p><strong>Type:</strong> ${eventType}</p>
           <p><strong>Details:</strong> ${payload.details}</p>`
        );
        logger.info('MonitoringNotification', `Sent alert email to ${email}`);
      } catch (err) {
        logger.error('MonitoringNotification', `Failed to send email: ${err.message}`);
      }
    }
  }
}

module.exports = new MonitoringNotificationService();
