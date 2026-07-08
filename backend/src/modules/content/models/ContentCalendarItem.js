const mongoose = require('mongoose');

const contentCalendarItemSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  contentItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem',
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  platform: String,
  title: String,
  status: String,
}, { timestamps: true });

contentCalendarItemSchema.index({ workspaceId: 1, scheduledDate: 1 });

module.exports = mongoose.model('ContentCalendarItem', contentCalendarItemSchema);
