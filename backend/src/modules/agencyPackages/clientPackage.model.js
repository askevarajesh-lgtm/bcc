const mongoose = require('mongoose');

const ClientPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: String, default: '' },
  description: { type: String, default: '' },
  features: [{ type: String }],
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billingInterval: { type: String, enum: ['Monthly', 'Yearly', 'One Time'], default: 'Monthly' }
}, { timestamps: true });

module.exports = mongoose.model('ClientPackage', ClientPackageSchema);
