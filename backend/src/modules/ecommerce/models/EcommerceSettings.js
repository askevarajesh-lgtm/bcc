const mongoose = require('mongoose');

const EcommerceSettingsSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  storeName: { type: String, default: 'My Awesome Store' },
  storeDescription: { type: String, default: '' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  shippingEnabled: { type: Boolean, default: true },
  shippingFee: { type: Number, default: 50 }, // fallback flat fee
  primaryColor: { type: String, default: '#3b82f6' },
  secondaryColor: { type: String, default: '#10b981' },
  paymentMethods: [{
    id: String,
    name: String,
    enabled: Boolean
  }],
  shippingMethods: [{
    id: String,
    name: String,
    price: Number,
    enabled: Boolean
  }]
}, { timestamps: true });

// Unique per store (one settings document per store)
EcommerceSettingsSchema.index({ storeId: 1 }, { unique: true });
EcommerceSettingsSchema.index({ workspaceId: 1, websiteId: 1, storeId: 1 });

module.exports = mongoose.model('EcommerceSettings', EcommerceSettingsSchema);
