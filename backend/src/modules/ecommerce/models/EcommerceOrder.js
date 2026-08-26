const mongoose = require('mongoose');

const EcommerceOrderSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  orderNumber: { type: String, required: true },
  idempotencyKey: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceCustomer', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  shippingAddress: { type: String, default: '' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProduct', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String }
  }],
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String },
  shippingMethodId: { type: String }
}, { timestamps: true });

EcommerceOrderSchema.index({ workspaceId: 1, websiteId: 1, storeId: 1 });
EcommerceOrderSchema.index({ workspaceId: 1, websiteId: 1, storeId: 1, idempotencyKey: 1 }, {
  unique: true,
  partialFilterExpression: { idempotencyKey: { $exists: true, $type: 'string' } }
});

module.exports = mongoose.model('EcommerceOrder', EcommerceOrderSchema);
