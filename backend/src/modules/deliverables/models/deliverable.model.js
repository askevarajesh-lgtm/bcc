const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  deliverableType: {
    type: String,
    required: true,
    enum: [
      'ad_creative',
      'landing_page',
      'content',
      'report',
      'social_post',
      'seo_audit',
      'strategy_deck',
      'website_design',
      'video_creative',
      'campaign_plan',
      'other'
    ],
    default: 'other'
  },
  status: {
    type: String,
    required: true,
    enum: ['backlog', 'in_progress', 'in_review', 'revisions', 'approved'],
    default: 'backlog'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Shimmed Agency/Tenant
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Brand account reference
    required: true,
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
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileCount: {
    type: Number,
    default: 0
  },
  approvalHistory: [{
    stage: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['submitted', 'approved', 'revision_requested']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  activityHistory: [{
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

// Indexes for fast querying
deliverableSchema.index({ companyId: 1, status: 1 });

deliverableSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Deliverable', deliverableSchema);
