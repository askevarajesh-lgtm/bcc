const mongoose = require("mongoose");

const salaryHistorySchema = new mongoose.Schema(
  {
    // Employee reference
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      comment: "Employee/Staff member this salary history belongs to",
    },
    // Company reference
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
      comment: "Tenant company this salary belongs to",
    },
    // Salary amounts
    oldSalary: {
      type: Number,
      required: true,
      min: 0,
      comment: "Previous salary amount (before change)",
    },
    newSalary: {
      type: Number,
      required: true,
      min: 0,
      comment: "New salary amount (after change)",
    },
    // Effective date - when the salary change took effect
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
      comment: "Date when the salary change became effective",
    },
    // Expense reference (optional - links to the expense entry)
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
      comment:
        "Reference to the expense entry that triggered this salary change",
    },
    // Change type
    changeType: {
      type: String,
      enum: ["increment", "decrement", "adjustment", "initial"],
      default: "increment",
      comment:
        "Type of salary change: increment (hike), decrement (cut), adjustment, or initial (first entry)",
    },
    // Change reason/notes
    reason: {
      type: String,
      trim: true,
      default: null,
      comment:
        'Reason for salary change (e.g., "Annual increment", "Promotion", etc.)',
    },
    // Additional notes
    notes: {
      type: String,
      trim: true,
      default: null,
      comment: "Additional notes about the salary change",
    },
    // Who created this history entry
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      comment: "User who created this salary history entry",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Indexes for efficient queries
salaryHistorySchema.index({ staffId: 1, companyId: 1 });
salaryHistorySchema.index({ staffId: 1, effectiveDate: -1 });
salaryHistorySchema.index({ companyId: 1, effectiveDate: -1 });
salaryHistorySchema.index({ expenseId: 1 });

module.exports = mongoose.model("SalaryHistory", salaryHistorySchema);
