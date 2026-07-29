const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: false
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domainPurchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DomainPurchase',
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true
  },
  closingInvoiceDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other'],
    required: true
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  screenshotUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected', 'Failed', 'Successful'],
    default: 'Pending'
  },
  transactionType: {
    type: String,
    enum: ['Online', 'Manual'],
    required: true
  },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  razorpaySignature: { type: String },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Tenant references for RBAC
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ invoiceId: 1 });
transactionSchema.index({ domainPurchaseId: 1 });
transactionSchema.index({ companyId: 1 });
transactionSchema.index({ adminId: 1, agencyId: 1, brandId: 1 });
transactionSchema.index({ paymentDate: -1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
