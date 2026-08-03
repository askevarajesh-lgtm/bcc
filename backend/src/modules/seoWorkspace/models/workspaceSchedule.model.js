const mongoose = require('mongoose');

const WorkspaceScheduleSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    required: true,
    index: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationWorkflow',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  scheduleType: {
    type: String,
    enum: ['cron', 'interval', 'calendar_once', 'business_daily'],
    default: 'cron'
  },
  cronExpression: {
    type: String,
    default: '0 0 * * *' // Daily at midnight
  },
  intervalMinutes: {
    type: Number,
    default: 60
  },
  specificDate: {
    type: Date,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  businessHoursOnly: {
    type: Boolean,
    default: false
  },
  businessStartHour: {
    type: Number,
    default: 9 // 9 AM
  },
  businessEndHour: {
    type: Number,
    default: 17 // 5 PM
  },
  businessDays: {
    type: [Number], // 1 = Monday, 5 = Friday
    default: [1, 2, 3, 4, 5]
  },
  blackoutWindows: [{
    name: String,
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  lastRunAt: {
    type: Date,
    default: null
  },
  nextRunAt: {
    type: Date,
    default: null,
    index: true
  },
  runCount: {
    type: Number,
    default: 0
  },
  consecutiveFailures: {
    type: Number,
    default: 0
  },
  lastRunStatus: {
    type: String,
    enum: ['idle', 'success', 'failed', 'skipped_blackout'],
    default: 'idle'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

WorkspaceScheduleSchema.index({ enabled: 1, nextRunAt: 1 });
WorkspaceScheduleSchema.index({ projectId: 1, workflowId: 1 });

module.exports = mongoose.model('WorkspaceSchedule', WorkspaceScheduleSchema);
