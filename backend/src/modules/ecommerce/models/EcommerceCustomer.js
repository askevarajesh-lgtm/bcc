const mongoose = require('mongoose');

const EcommerceCustomerSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  address: { type: String, default: '' },
  ordersCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate customers per store (storeId + email unique)
EcommerceCustomerSchema.index({ storeId: 1, email: 1 }, { unique: true });
EcommerceCustomerSchema.index({ workspaceId: 1, websiteId: 1, storeId: 1 });

module.exports = mongoose.model('EcommerceCustomer', EcommerceCustomerSchema);
