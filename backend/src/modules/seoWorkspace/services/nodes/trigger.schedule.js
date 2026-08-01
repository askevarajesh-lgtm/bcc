module.exports = {
  id: 'trigger_schedule',
  
  metadata: () => ({
    id: 'trigger_schedule',
    name: 'Schedule Trigger',
    description: 'Triggers workflow on a recurring schedule (cron)',
    category: 'time',
    icon: 'clock'
  }),

  validate: (config) => {
    if (!config || !config.cronExpression) return false;
    return true;
  },

  evaluate: (eventData, config) => {
    // A schedule trigger only fires if the event source is 'scheduler'
    // and the specific workflow is due based on the cron expression.
    // Real implementation would evaluate cron against current time.
    if (eventData.source === 'scheduler') return true;
    return false;
  }
};
