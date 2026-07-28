const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    role: {
      type: String,
      required: true,
    },
    // Sales metrics
    salesTarget: {
      type: Number,
      default: 0,
    },
    salesAchieved: {
      type: Number,
      default: 0,
    },
    // Operations metrics
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksOnTime: {
      type: Number,
      default: 0,
    },
    tasksDelayed: {
      type: Number,
      default: 0,
    },
    averageQualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reworkCount: {
      type: Number,
      default: 0,
    },
    // Overall score
    kriScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    kptScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for overall score calculation (average of KRI and KPT)
performanceSchema.virtual("calculatedOverallScore").get(function () {
  return (this.kriScore + this.kptScore) / 2;
});

// Ensure virtual fields are serialized
performanceSchema.set("toJSON", { virtuals: true });
performanceSchema.set("toObject", { virtuals: true });

performanceSchema.index({ userId: 1, month: 1, year: 1 });
performanceSchema.index({ companyId: 1 });

module.exports = mongoose.model("Performance", performanceSchema);
