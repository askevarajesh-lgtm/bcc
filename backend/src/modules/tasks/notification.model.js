const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "task_assigned",
        "task_status_changed",
        "task_priority_changed",
        "task_due_date_reminder",
        "task_due_reminder", // Alias for task_due_date_reminder
        "task_comment_added",
        "task_mentioned",
        "task_attachment_added",
        "task_completed",
        "task_reminder",
        "performance_review_completed",
        "performance_self_assessment_pending",
        "daily_note_reminder",
        "client_onboarded",
        "campaign_recharge_added",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Notification channels
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      // Future: sms, push, etc.
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ taskId: 1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
