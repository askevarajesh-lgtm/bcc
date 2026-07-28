const mongoose = require("mongoose");

const coordinatorTaskSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instruction: {
      type: String,
      trim: true,
      required: false,
    },
    response: {
      type: String,
      trim: true,
      default: "",
    },
    pendingReason: {
      type: String,
      trim: true,
      default: "",
    },
    checklist: [
      {
        label: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["assigned", "in_progress", "completed"],
      default: "completed",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    taskDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

coordinatorTaskSchema.index({ taskDate: 1 });
coordinatorTaskSchema.index({ companyId: 1, taskDate: 1 });

module.exports = mongoose.model("CoordinatorTask", coordinatorTaskSchema);
