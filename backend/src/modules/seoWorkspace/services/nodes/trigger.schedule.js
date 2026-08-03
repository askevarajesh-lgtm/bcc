const logger = require('../../../aiCore/logger.service');

module.exports = {
  id: 'trigger_schedule',
  metadata: () => ({
    id: 'trigger_schedule',
    name: 'Schedule (Cron / Interval)',
    description: 'Triggers a workflow on a recurring cron expression or calendar schedule',
    category: 'triggers',
    icon: 'clock',
    inputs: [],
    outputs: ['timestamp', 'scheduleId', 'cronExpression']
  }),

  validate: (config) => {
    return Boolean(config && (config.cron || config.intervalMinutes || config.scheduleId));
  },

  match: (config, eventPayload) => {
    if (!config) return false;
    if (config.scheduleId && eventPayload.scheduleId && config.scheduleId === eventPayload.scheduleId) return true;
    return true;
  }
};
