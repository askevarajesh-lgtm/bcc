const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // User association (for login)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Information
    employeeCode: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
    },
    profilePhoto: {
      type: String,
    },

    // Work Details
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HRDepartment",
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HRDesignation",
    },
    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    employmentType: {
      type: String,
      enum: ["Full Time", "Part Time", "Contract", "Freelancer", "Intern"],
      default: "Full Time",
    },
    workMode: {
      type: String,
      enum: ["Office", "Remote", "Hybrid"],
      default: "Office",
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    confirmationDate: {
      type: Date,
    },

    // Status
    status: {
      type: String,
      enum: ["Active", "Probation", "On Leave", "Notice Period", "Resigned", "Terminated"],
      default: "Active",
    },

    // Personal Details
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    bloodGroup: String,
    address: {
      current: String,
      permanent: String,
    },
    emergencyContact: {
      name: String,
      relation: String,
      number: String,
    },

    // Documents (IDs)
    aadhaarNumber: String,
    panNumber: String,
    passportNumber: String,

    // Finance/Bank
    salaryStructure: {
      ctc: Number,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branchName: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

employeeSchema.index({ tenantCompanyId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ tenantCompanyId: 1, email: 1 }, { unique: true });

employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Employee", employeeSchema);
