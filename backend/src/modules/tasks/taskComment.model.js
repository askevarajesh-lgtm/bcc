const mongoose = require("mongoose");

const taskCommentSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // For rich text support
    isRichText: {
      type: Boolean,
      default: false,
    },
    // Mentions in comments
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Attachments in comments
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
taskCommentSchema.index({ taskId: 1, createdAt: -1 });
taskCommentSchema.index({ userId: 1 });

module.exports = mongoose.model("TaskComment", taskCommentSchema);
