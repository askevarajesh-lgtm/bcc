const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: function() {
      return this.grandTotal;
    },
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid'],
    default: 'Pending'
  },
  invoiceStatus: {
    type: String,
    enum: ['Draft', 'Sent', 'Pending', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  dueDate: {
    type: Date
  },
  paymentMode: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  invoiceType: {
    type: String,
    enum: ['One Time', 'Retainer'],
    default: 'One Time'
  },
  nextGenerationDate: {
    type: Date,
    default: null
  },
  retainerDuration: {
    type: String,
    default: '1 Month'
  },
  parentInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
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

invoiceSchema.index({ clientId: 1, adminId: 1, agencyId: 1, brandId: 1 });
invoiceSchema.index({ proposalId: 1 });
invoiceSchema.index({ paymentStatus: 1 });
// Supports Analytics & Attribution revenue aggregations (date-ranged, per-agency/client)
invoiceSchema.index({ agencyId: 1, clientId: 1, createdAt: -1 });

// Auto-generate invoice number
invoiceSchema.pre('validate', async function() {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${Date.now()}-${count + 1}`;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);