const mongoose = require("mongoose");

const recruitmentSchema = new mongoose.Schema(
  {
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HRDepartment",
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HRDesignation",
    },
    experienceRequired: {
      type: String, // e.g. "2-4 Years"
    },
    salaryRange: {
      type: String, // e.g. "500000 - 800000"
    },
    hiringManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "On Hold", "Closed"],
      default: "Open",
    },
    candidates: [
      {
        name: String,
        email: String,
        phone: String,
        resumeUrl: String,
        status: {
          type: String,
          enum: ["Applied", "Screening", "Interview", "Selected", "Rejected", "Joined"],
          default: "Applied"
        },
        feedback: String,
        interviewDate: Date
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

recruitmentSchema.index({ tenantCompanyId: 1, status: 1 });

module.exports = mongoose.model("Recruitment", recruitmentSchema);
