const mongoose = require('mongoose');

const EcommerceCustomerSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: '' },
  ordersCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate customers per store (workspaceId + websiteId + storeId + email unique)
EcommerceCustomerSchema.index({ workspaceId: 1, websiteId: 1, storeId: 1, email: 1 }, { unique: true });
EcommerceCustomerSchema.index({ storeId: 1, email: 1 }); // Non-unique fallback for fast lookup if needed

module.exports = mongoose.model('EcommerceCustomer', EcommerceCustomerSchema);
