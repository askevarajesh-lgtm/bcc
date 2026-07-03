const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: String,
      trim: true,
    },
    meetingType: {
      type: String,
      enum: [
        'client_review',
        'internal_meeting',
        'prospect_meeting',
        'campaign_planning',
        'seo_review',
        'content_review',
        'sales_call',
        'retainer_renewal',
        'business_review',
        'team_review',
        'other'
      ],
      default: 'internal_meeting',
    },
    status: {
      type: String,
      enum: [
        'upcoming',
        'awaiting_confirmation',
        'completed',
        'cancelled',
        'rescheduled',
        'missed'
      ],
      default: 'upcoming',
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // format "HH:MM"
      required: true,
    },
    duration: {
      type: Number, // duration in minutes
      default: 30,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    history: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String,
      }
    ],
    googleEventId: {
      type: String,
      default: null,
    },
    outlookEventId: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ companyId: 1 });
meetingSchema.index({ clientId: 1 });
meetingSchema.index({ host: 1 });
meetingSchema.index({ date: 1 });
meetingSchema.index({ status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
