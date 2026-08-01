const mongoose = require("mongoose");

const salesTargetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      comment: "Individual user target (null for team targets)",
    },
    team: {
      type: String,
      trim: true,
      required: false,
      default: null,
      comment: "Team name for team-wise targets (null for individual targets)",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    achievedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.targetAmount;
      },
    },
    // Enhanced tracking fields
    totalIncome: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Total income from paid invoices (handling amount only)",
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Pending amount from unpaid invoices",
    },
    profitAmount: {
      type: Number,
      default: 0,
      comment: "Profit amount (income - expenses)",
    },
    profitPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      comment: "Profit percentage (profitAmount / totalIncome * 100)",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes

salesTargetSchema.index({ companyId: 1 });

// Prevent duplicate targets (either userId or team must be unique per period)
salesTargetSchema.index(
  { userId: 1, month: 1, year: 1 },
  { unique: true, sparse: true },
);
salesTargetSchema.index(
  { team: 1, month: 1, year: 1 },
  { unique: true, sparse: true },
);

// Validation: Either userId or team must be provided
salesTargetSchema.pre("validate", function (next) {
  if (!this.userId && !this.team) {
    next(new Error("Either userId or team must be provided"));
  } else {
    next();
  }
});

module.exports = mongoose.model("SalesTarget", salesTargetSchema);
