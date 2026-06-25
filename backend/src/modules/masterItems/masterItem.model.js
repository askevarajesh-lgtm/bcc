const mongoose = require('mongoose');

const masterItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  itemCode: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  duration: {
    type: String,
    trim: true,
    comment: 'e.g., 1 Month, 2 Weeks, etc.'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
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

// Indexes for common queries
masterItemSchema.index({ name: 1, adminId: 1, agencyId: 1, brandId: 1 });
masterItemSchema.index({ itemCode: 1 });
masterItemSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('MasterItem', masterItemSchema);
