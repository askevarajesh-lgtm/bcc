const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true },
  interval: { type: String, default: '/month' },
  description: { type: String, required: true },
  features: [{ type: String }],
  popular: { type: Boolean, default: false },
  active: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionSchema);
