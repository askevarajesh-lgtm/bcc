const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["Casual Leave", "Sick Leave", "Paid Leave", "Loss Of Pay", "Comp Off", "Work From Home", "Maternity Leave", "Paternity Leave"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

leaveSchema.index({ tenantCompanyId: 1, employeeId: 1, status: 1 });

module.exports = mongoose.model("Leave", leaveSchema);
