const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "On Leave", "Holiday"],
      default: "Present",
    },
    clockIn: {
      type: Date,
    },
    clockOut: {
      type: Date,
    },
    workHours: {
      type: Number, // In hours or minutes
      default: 0,
    },
    breaks: [
      {
        startTime: Date,
        endTime: Date,
        duration: Number, // In minutes
      }
    ],
    totalBreakDuration: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    location: {
      type: String, // E.g., Office, Remote, or GPS coordinates
    },
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// An employee can only have one attendance record per day
attendanceSchema.index({ tenantCompanyId: 1, employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
