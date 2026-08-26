const mongoose = require('mongoose');

const EcommercePaymentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder', required: true },
  customerName: { type: String, required: true },
  method: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' }
}, { timestamps: true });

EcommercePaymentSchema.index({ workspaceId: 1, websiteId: 1 });

module.exports = mongoose.model('EcommercePayment', EcommercePaymentSchema);
