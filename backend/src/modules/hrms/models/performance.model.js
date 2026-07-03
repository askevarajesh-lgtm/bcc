const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
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
    reviewCycle: {
      type: String, // e.g. "Q2 2026" or "Annual 2026"
      required: true,
    },
    kpis: [
      {
        goal: String,
        target: String,
        achieved: String,
        score: { type: Number, min: 1, max: 5 }
      }
    ],
    selfReview: {
      type: String,
    },
    managerReview: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Manager Review", "Completed"],
      default: "Draft",
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    }
  },
  {
    timestamps: true,
  }
);

performanceSchema.index({ tenantCompanyId: 1, employeeId: 1, reviewCycle: 1 }, { unique: true });

module.exports = mongoose.model("Performance", performanceSchema);
