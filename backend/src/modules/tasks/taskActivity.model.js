const mongoose = require("mongoose");

const taskActivitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "status_changed",
        "priority_changed",
        "assigned",
        "reassigned",
        "comment_added",
        "attachment_added",
        "due_date_changed",
        "label_added",
        "label_removed",
        "watcher_added",
        "watcher_removed",
        "reminder_sent",
      ],
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    description: {
      type: String,
      trim: true,
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

// Indexes for efficient querying
taskActivitySchema.index({ taskId: 1, createdAt: -1 });
taskActivitySchema.index({ userId: 1, createdAt: -1 });
taskActivitySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("TaskActivity", taskActivitySchema);
