const mongoose = require("mongoose");

const plEntrySchema = new mongoose.Schema(
  {
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    // Entry type
    entryType: {
      type: String,
      enum: ["revenue", "cost"],
      required: true,
    },
    // Revenue side
    revenue: {
      invoiceAmount: Number,
      taxes: Number,
      discounts: Number,
      netRevenue: Number,
    },
    // Cost side
    cost: {
      staffCost: Number, // Task time × role cost
      correctionCost: Number, // If internal mistake
      platformCost: Number, // Ads, tools
      otherCost: Number,
      totalCost: Number,
    },
    // Calculated fields
    grossProfit: Number,
    netProfit: Number,
    marginPercent: Number,
    // Period
    period: {
      month: {
        type: Number, // 1-12
        required: true,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    // Timestamp
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
plEntrySchema.index({ tenantCompanyId: 1 });
plEntrySchema.index({ projectId: 1 });
plEntrySchema.index({ invoiceId: 1 });
plEntrySchema.index({ "period.month": 1, "period.year": 1 });
plEntrySchema.index({ entryType: 1 });

module.exports = mongoose.model("PLEntry", plEntrySchema);
