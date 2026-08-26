const mongoose = require('mongoose');

const EcommerceShippingSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder', required: true },
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  methodName: { type: String, required: true },
  trackingId: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Shipped', 'In Transit', 'Delivered', 'Returned'], default: 'Pending' }
}, { timestamps: true });

EcommerceShippingSchema.index({ workspaceId: 1, websiteId: 1 });

module.exports = mongoose.model('EcommerceShipping', EcommerceShippingSchema);
