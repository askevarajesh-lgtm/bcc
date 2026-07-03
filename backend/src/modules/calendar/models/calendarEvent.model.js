const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'client_review',
      'strategy_call',
      'campaign_launch',
      'content_approval',
      'internal_sync',
      'sales_call',
      'proposal_review',
      'retainer_renewal',
      'performance_review',
      'team_meeting',
      'other'
    ],
    default: 'other'
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'upcoming', 'awaiting_confirmation', 'rescheduled', 'cancelled', 'missed'],
    default: 'upcoming'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency', // Tenant scoping
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Client / Brand account reference
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    index: true
  },
  isInternal: {
    type: Boolean,
    default: true
  },
  reminderSettings: {
    leadTimeMinutes: {
      type: Number,
      default: 60 // 1 hour before by default
    },
    sent: {
      type: Boolean,
      default: false
    }
  },
  history: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    details: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
calendarEventSchema.index({ startDateTime: 1, endDateTime: 1 });
calendarEventSchema.index({ companyId: 1, status: 1 });
calendarEventSchema.index({ host: 1 });
calendarEventSchema.index({ attendees: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
