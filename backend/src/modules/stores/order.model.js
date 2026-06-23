const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, index: true },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed', 'Refunded'], default: 'Pending' },
  fulfillmentStatus: { type: String, enum: ['Unfulfilled', 'Fulfilled', 'Shipped'], default: 'Unfulfilled' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

OrderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('Order', OrderSchema);
