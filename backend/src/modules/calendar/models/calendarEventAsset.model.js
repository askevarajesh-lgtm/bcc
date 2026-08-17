const mongoose = require('mongoose');

const options = { discriminatorKey: 'assetType', collection: 'calendar_events', timestamps: true };

const CalendarEventAssetSchema = new mongoose.Schema({}, options);

CalendarEventAssetSchema.index({ companyId: 1 }, { sparse: true });
CalendarEventAssetSchema.index({ eventId: 1 }, { sparse: true });

const CalendarEventAsset = mongoose.model('CalendarEventAsset', CalendarEventAssetSchema);

// 1. Calendar Event
const CalendarEvent = CalendarEventAsset.discriminator('CalendarEvent', new mongoose.Schema({
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
    ref: 'Agency', 
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
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
      default: 60 
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
}), 'event');

CalendarEventAssetSchema.index({ startDateTime: 1, endDateTime: 1 }, { sparse: true });
CalendarEventAssetSchema.index({ companyId: 1, status: 1 }, { sparse: true });
CalendarEventAssetSchema.index({ host: 1 }, { sparse: true });
CalendarEventAssetSchema.index({ attendees: 1 }, { sparse: true });

// 2. Event Attachment
const EventAttachment = CalendarEventAsset.discriminator('EventAttachment', new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CalendarEventAsset',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileType: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}), 'attachment');

// 3. Event Note
const EventNote = CalendarEventAsset.discriminator('EventNote', new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CalendarEventAsset',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}), 'note');

module.exports = {
  CalendarEventAsset,
  CalendarEvent,
  EventAttachment,
  EventNote
};
