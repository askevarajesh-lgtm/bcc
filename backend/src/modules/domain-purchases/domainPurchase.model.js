const mongoose = require("mongoose");

const domainPurchaseSchema = new mongoose.Schema(
  {
    tenantCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      comment: "Company Name - selected from client companies",
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    contactCountryCode: {
      type: String,
      trim: true,
      default: "91",
    },
    domainName: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    product: {
      type: String,
      trim: true,
    },
    paidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    balance: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    gst: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentDetail: {
      type: String,
      trim: true,
    },
    paymentRemarks: {
      type: String,
      trim: true,
    },
    paymentScreenshotUrl: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
domainPurchaseSchema.index({ tenantCompanyId: 1 });
domainPurchaseSchema.index({ companyId: 1 });
domainPurchaseSchema.index({ domainName: 1 });
domainPurchaseSchema.index({ paymentDate: 1 });
domainPurchaseSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("DomainPurchase", domainPurchaseSchema);
