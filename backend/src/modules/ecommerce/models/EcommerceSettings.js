const mongoose = require('mongoose');

const EcommerceSettingsSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true, unique: true },
  storeName: { type: String, default: 'My Awesome Store' },
  storeDescription: { type: String, default: '' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  shippingEnabled: { type: Boolean, default: true },
  shippingFee: { type: Number, default: 50 }, // fallback
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

module.exports = mongoose.model('EcommerceSettings', EcommerceSettingsSchema);
